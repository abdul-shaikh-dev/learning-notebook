"""Independent temporary-fixture checks for reproducible offline ZIP resources."""
from copy import deepcopy
import importlib.util
from io import BytesIO
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile


BUILDER_PATH = Path(__file__).resolve().parents[1] / 'scripts' / 'build-bundles.py'
spec = importlib.util.spec_from_file_location('resource_bundle_builder', BUILDER_PATH)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ResourceBundleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repo'
        self.course = self.root / 'paths' / 'example'
        (self.course / 'practice').mkdir(parents=True)
        (self.course / 'practice' / 'lesson.py').write_bytes(b'print("lesson")\n')
        (self.course / 'README.md').write_bytes(b'# Original README\nKeep me exactly.\n')
        (self.course / 'path.json').write_text(json.dumps({
            'id': 'example', 'status': 'ready', 'title': 'Example course'}), encoding='utf-8')
        self.resources = {
            'folder': 'example-practice',
            'files': [
                {'id': 'code', 'href': 'paths/example/practice/lesson.py',
                 'role': 'starter', 'description': 'Run the small lesson.'},
                {'id': 'guide', 'href': 'paths/example/README.md',
                 'role': 'instructions', 'description': 'Original notes.'}],
            'tasks': [{'id': 'try-it', 'title': 'Run the example', 'goal': 'See a local result.',
                       'fileIds': ['code', 'guide'], 'steps': ['Open a terminal in the extracted folder.'],
                       'commands': [{'label': 'Run', 'command': 'python lesson.py', 'expected': 'Prints lesson.'}],
                       'notes': ['No network or credentials.'],
                       'prerequisites': [{'label': 'Python installed', 'href': 'https://www.python.org/downloads/'}]}],
            'lessonTasks': {'first': ['try-it']},
            'bundle': {'href': 'paths/example/practice-bundle.zip'},
        }
        self.write_metadata()

    def write_metadata(self):
        (self.course / 'resources.json').write_text(json.dumps(self.resources), encoding='utf-8')

    @property
    def output(self):
        return self.course / 'practice-bundle.zip'

    def test_reproducible_bytes_flat_layout_metadata_and_guide(self):
        self.assertEqual(builder.build_bundles(self.root), 1)
        first = self.output.read_bytes()
        before = self.output.stat().st_mtime_ns
        os.utime(self.course / 'practice' / 'lesson.py', (123, 123))
        self.assertEqual(builder.build_bundles(self.root), 1)
        self.assertEqual(first, self.output.read_bytes())
        self.assertEqual(before, self.output.stat().st_mtime_ns)
        with zipfile.ZipFile(BytesIO(first)) as archive:
            names = archive.namelist()
            self.assertEqual(names, ['example-practice/README.md', 'example-practice/START-HERE.txt',
                                     'example-practice/lesson.py'])
            self.assertEqual(archive.read('example-practice/README.md'), b'# Original README\nKeep me exactly.\n')
            self.assertEqual(archive.read('example-practice/lesson.py'), b'print("lesson")\n')
            start = archive.read('example-practice/START-HERE.txt').decode('utf-8')
            for expected in ('lesson.py [starter]', 'Original notes.', 'Run the example',
                             'python lesson.py', 'Expected: Prints lesson.',
                             'No network or credentials.', 'Python installed'):
                self.assertIn(expected, start)
            self.assertNotIn('\r', start)
            for item in archive.infolist():
                self.assertEqual(item.date_time, (1980, 1, 1, 0, 0, 0))
                self.assertEqual(item.create_system, 3)
                self.assertEqual(item.external_attr >> 16, 0o100644)
                self.assertEqual(item.compress_type, zipfile.ZIP_STORED)

    def test_check_detects_staleness_without_modifying_archive(self):
        builder.build_bundles(self.root)
        first, before = self.output.read_bytes(), self.output.stat().st_mtime_ns
        self.assertEqual(builder.build_bundles(self.root, check=True), 1)
        (self.course / 'practice' / 'lesson.py').write_bytes(b'changed\n')
        with self.assertRaisesRegex(builder.BundleError, 'stale'):
            builder.build_bundles(self.root, check=True)
        self.assertEqual(self.output.read_bytes(), first)
        self.assertEqual(self.output.stat().st_mtime_ns, before)

    def test_text_crlf_and_lf_checkouts_produce_identical_bundles(self):
        content = 'First line: café\nSecond line\n'.encode('utf-8')
        paths = [self.course / 'practice' / 'lesson.py', self.course / 'README.md']
        for extension in ('.ts', '.json', '.csv', '.sql', '.csproj', '.svg'):
            filename = 'extra' + extension
            paths.append(self.course / filename)
            self.resources['files'].append({'id': filename, 'href': 'paths/example/' + filename,
                                           'role': 'reference', 'description': 'Line ending fixture.'})
        for path in paths:
            path.write_bytes(content)
        binary = b'\x89PNG\r\n\x1a\n\xffpayload\r\n'
        (self.course / 'diagram.png').write_bytes(binary)
        self.resources['files'].append({'id': 'binary', 'href': 'paths/example/diagram.png',
                                       'role': 'diagram', 'description': 'Byte preservation fixture.'})
        self.write_metadata()
        builder.build_bundles(self.root)
        lf_bundle = self.output.read_bytes()
        for path in paths:
            path.write_bytes(content.replace(b'\n', b'\r\n'))
        self.assertEqual(builder.build_bundles(self.root, check=True), 1)
        builder.build_bundles(self.root)
        self.assertEqual(self.output.read_bytes(), lf_bundle)
        # The builder normalizes archive payloads, not the working checkout.
        self.assertIn(b'\r\n', paths[0].read_bytes())
        with zipfile.ZipFile(self.output) as archive:
            for path in paths:
                self.assertEqual(archive.read('example-practice/' + path.name), content)
            self.assertEqual(archive.read('example-practice/diagram.png'), binary)

    def test_invalid_utf8_text_is_rejected_without_output(self):
        (self.course / 'practice' / 'lesson.py').write_bytes(b'not UTF-8: \xff\r\n')
        with self.assertRaisesRegex(builder.BundleError, 'must be UTF-8'):
            builder.build_bundles(self.root)
        self.assertFalse(self.output.exists())

    def test_missing_check_does_not_create_output_or_parent(self):
        self.resources['bundle']['href'] = 'paths/example/generated/practice-bundle.zip'
        self.write_metadata()
        with self.assertRaisesRegex(builder.BundleError, 'missing or stale'):
            builder.build_bundles(self.root, check=True)
        self.assertFalse((self.course / 'generated').exists())

    def test_metadata_change_makes_guide_stale(self):
        builder.build_bundles(self.root)
        self.resources['tasks'][0]['commands'][0]['expected'] = 'Updated expected result.'
        self.write_metadata()
        with self.assertRaisesRegex(builder.BundleError, 'stale'):
            builder.build_bundles(self.root, check=True)

    def test_duplicate_flat_names_and_reserved_start_file_rejected(self):
        (self.course / 'other').mkdir()
        for filename in ('lesson.py', 'LESSON.PY', 'START-HERE.txt'):
            (self.course / 'other' / filename).write_text('extra', encoding='utf-8')
            resources = deepcopy(self.resources)
            resources['files'].append({'id': 'other', 'href': 'paths/example/other/' + filename,
                                       'role': 'data', 'description': 'Duplicate test.'})
            (self.course / 'resources.json').write_text(json.dumps(resources), encoding='utf-8')
            with self.subTest(filename=filename), self.assertRaisesRegex(builder.BundleError, 'Duplicate flat'):
                builder.build_bundles(self.root)
        self.assertFalse(self.output.exists())

    def test_unsafe_source_spellings_rejected(self):
        invalid = ['/etc/passwd', '../outside.txt', 'paths/example/../README.md',
                   'C:/outside.txt', 'paths\\example\\README.md',
                   'paths//example/README.md', 'paths/example/./README.md',
                   'paths/example/README.md#section', 'paths/example/README.md?raw=1',
                   'paths/example/%2e%2e/README.md', 'paths/example/NUL.txt']
        for href in invalid:
            self.resources['files'][0]['href'] = href
            self.write_metadata()
            with self.subTest(href=href), self.assertRaises(builder.BundleError):
                builder.build_bundles(self.root)

    def test_missing_file_and_directory_sources_rejected(self):
        for href in ('paths/example/missing.py', 'paths/example/practice'):
            self.resources['files'][0]['href'] = href
            self.write_metadata()
            with self.subTest(href=href), self.assertRaises(builder.BundleError):
                builder.build_bundles(self.root)

    def test_output_must_stay_in_matching_course(self):
        for href in ('outside.zip', 'paths/another/course.zip', '../escape.zip',
                     'paths/example/practice-bundle.txt', 'paths/example/../escape.zip'):
            self.resources['bundle']['href'] = href
            self.write_metadata()
            with self.subTest(href=href), self.assertRaises(builder.BundleError):
                builder.build_bundles(self.root)

    def test_resolved_source_escape_rejected_on_every_platform(self):
        # Resolve seam represents a link/junction escape even on Windows hosts
        # that cannot create symlinks without developer mode or privileges.
        source = self.course / 'practice' / 'lesson.py'
        outside = Path(self.temp.name) / 'outside.py'
        outside.write_text('outside', encoding='utf-8')
        actual_resolve = Path.resolve
        def resolve(path, *args, **kwargs):
            return outside if path == source else actual_resolve(path, *args, **kwargs)
        with patch.object(Path, 'resolve', resolve), self.assertRaisesRegex(builder.BundleError, 'inside the repository'):
            builder.build_bundles(self.root)
        self.assertFalse(self.output.exists())

    def test_real_symlink_escape_if_supported(self):
        outside = Path(self.temp.name) / 'outside.py'
        outside.write_text('outside', encoding='utf-8')
        link = self.course / 'linked.py'
        try:
            link.symlink_to(outside)
        except (OSError, NotImplementedError) as error:
            self.skipTest(f'Host cannot create symlinks: {error}')
        self.resources['files'][0]['href'] = 'paths/example/linked.py'
        self.write_metadata()
        with self.assertRaisesRegex(builder.BundleError, 'inside the repository'):
            builder.build_bundles(self.root)

    def test_output_parent_escape_rejected(self):
        target_parent = self.course / 'generated'
        outside = Path(self.temp.name) / 'outside'
        outside.mkdir()
        self.resources['bundle']['href'] = 'paths/example/generated/practice-bundle.zip'
        self.write_metadata()
        actual_resolve = Path.resolve
        def resolve(path, *args, **kwargs):
            if path == target_parent / 'practice-bundle.zip':
                return outside / 'practice-bundle.zip'
            return actual_resolve(path, *args, **kwargs)
        with patch.object(Path, 'resolve', resolve), self.assertRaisesRegex(builder.BundleError, 'escapes'):
            builder.build_bundles(self.root)
        self.assertEqual(list(outside.iterdir()), [])

    def test_structured_task_fields_are_not_coerced(self):
        mutations = [('steps', 'run something'), ('notes', {'bad': 'shape'}),
                     ('commands', ['python lesson.py']),
                     ('commands', [{'label': 'Run', 'command': 'python lesson.py', 'expected': []}]),
                     ('prerequisites', ['Python']), ('fileIds', ['unknown'])]
        for field, value in mutations:
            resources = deepcopy(self.resources)
            resources['tasks'][0][field] = value
            (self.course / 'resources.json').write_text(json.dumps(resources), encoding='utf-8')
            with self.subTest(field=field), self.assertRaises(builder.BundleError):
                builder.build_bundles(self.root)

    def test_safe_root_shared_file_is_supported(self):
        (self.root / 'handbook.html').write_bytes(b'<h1>Study pack</h1>')
        self.resources['files'].append({'id': 'pack', 'href': 'handbook.html',
                                       'role': 'reference', 'description': 'Shared study pack.'})
        self.write_metadata()
        builder.build_bundles(self.root)
        with zipfile.ZipFile(self.output) as archive:
            self.assertEqual(archive.read('example-practice/handbook.html'), b'<h1>Study pack</h1>')

    def test_planned_courses_skip_missing_resources(self):
        planned = self.root / 'paths' / 'planned'
        planned.mkdir()
        (planned / 'path.json').write_text(json.dumps({'id': 'planned', 'status': 'planned'}), encoding='utf-8')
        self.assertEqual(builder.build_bundles(self.root), 1)

    def test_all_metadata_validated_before_any_output_is_written(self):
        bad = self.root / 'paths' / 'zzz'
        bad.mkdir()
        (bad / 'path.json').write_text(json.dumps({'id': 'zzz', 'status': 'ready', 'title': 'Bad'}), encoding='utf-8')
        with self.assertRaises(builder.BundleError):
            builder.build_bundles(self.root)
        self.assertFalse(self.output.exists())

    def test_cli_check_exit_code_and_no_write(self):
        result = subprocess.run([sys.executable, str(BUILDER_PATH), '--root', str(self.root), '--check'],
                                capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 1)
        self.assertIn('missing or stale', result.stderr)
        self.assertFalse(self.output.exists())
        builder.build_bundles(self.root)
        result = subprocess.run([sys.executable, str(BUILDER_PATH), '--root', str(self.root), '--check'],
                                capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('1 resource bundles verified', result.stdout)


if __name__ == '__main__':
    unittest.main()
