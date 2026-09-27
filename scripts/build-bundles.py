#!/usr/bin/env python3
"""Create reproducible, offline course ZIPs from explicit resources.json inputs.

ZIP_STORED deliberately avoids compressor-version differences. Member order,
timestamps, permissions and generated text are fixed. --check never writes.
Supported text extensions require UTF-8 and are archived with LF line endings,
so Git CRLF/LF checkouts produce identical ZIPs. Binary payloads stay byte-exact;
normalization never changes the source files.
"""
from __future__ import annotations

import argparse
from io import BytesIO
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
import unicodedata
import zipfile


SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
WINDOWS_DEVICE = re.compile(r'(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?\Z', re.I)
START_NAME = 'START-HERE.txt'
TEXT_EXTENSIONS = frozenset({
    '.py', '.cs', '.csproj', '.sln', '.sql', '.js', '.mjs', '.cjs', '.jsx',
    '.ts', '.tsx', '.json', '.md', '.txt', '.csv', '.html', '.css', '.svg',
    '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.sh', '.ps1',
})


class BundleError(ValueError):
    """Invalid metadata, unsafe path or stale generated bundle."""


def text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise BundleError(f'{label} must be a nonempty string')
    return value


def strings(value, label):
    if not isinstance(value, list):
        raise BundleError(f'{label} must be an array of strings')
    return [text(item, label) for item in value]


def object_value(value, label):
    if not isinstance(value, dict):
        raise BundleError(f'{label} must be an object')
    return value


def portable_component(part):
    if (not part or part in {'.', '..'} or part.endswith((' ', '.'))
            or any(ord(char) < 32 or ord(char) == 127 for char in part)
            or any(char in '<>:"\\|?*#%' for char in part)
            or WINDOWS_DEVICE.fullmatch(part)):
        raise BundleError(f'Unsafe path component: {part!r}')


def relative_path(value, label):
    value = text(value, label)
    if value.startswith('/') or '\\' in value:
        raise BundleError(f'{label} must be a repository-relative POSIX path')
    # Split the original spelling so normalizing dot/repeated-slash segments
    # cannot conceal an unsafe or ambiguous href.
    for part in value.split('/'):
        portable_component(part)
    return PurePosixPath(value)


def under(path, parent):
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def regular_source(root, href):
    relative = relative_path(href, 'source href')
    candidate = root.joinpath(*relative.parts)
    try:
        resolved = candidate.resolve(strict=True)
    except (OSError, RuntimeError) as error:
        raise BundleError(f'Missing or invalid source: {href}') from error
    if not under(resolved, root) or not resolved.is_file():
        raise BundleError(f'Source must be a regular file inside the repository: {href}')
    return resolved


def json_object(path):
    try:
        return object_value(json.loads(path.read_text(encoding='utf-8')), str(path))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise BundleError(f'Cannot read JSON: {path}') from error


def source_bytes(path, name):
    payload = path.read_bytes()
    if Path(name).suffix.lower() not in TEXT_EXTENSIONS and Path(name).name not in {'Dockerfile', '.dockerignore'}:
        return payload
    try:
        decoded = payload.decode('utf-8')
    except UnicodeDecodeError as error:
        raise BundleError(f'Text resource must be UTF-8: {name}') from error
    return decoded.replace('\r\n', '\n').replace('\r', '\n').encode('utf-8')


def normalize_tasks(resources, file_ids):
    tasks = resources.get('tasks')
    if not isinstance(tasks, list):
        raise BundleError('tasks must be an array')
    accepted, ids = [], set()
    for raw in tasks:
        task = object_value(raw, 'task')
        task_id = text(task.get('id'), 'task id')
        if task_id in ids:
            raise BundleError(f'Duplicate task id: {task_id}')
        ids.add(task_id)
        title = text(task.get('title'), 'task title')
        goal = text(task.get('goal'), 'task goal')
        references = strings(task.get('fileIds'), 'task fileIds')
        if len(set(references)) != len(references) or any(x not in file_ids for x in references):
            raise BundleError(f'Unknown or duplicate file reference in task: {task_id}')
        steps = strings(task.get('steps', []), 'task steps')
        notes = strings(task.get('notes', []), 'task notes')
        commands = task.get('commands', [])
        if not isinstance(commands, list):
            raise BundleError('task commands must be an array')
        checked_commands = []
        for raw_command in commands:
            command = object_value(raw_command, 'task command')
            checked_commands.append({key: text(command.get(key), 'command ' + key)
                                     for key in ('label', 'command', 'expected')})
        prerequisites = task.get('prerequisites', [])
        if not isinstance(prerequisites, list):
            raise BundleError('task prerequisites must be an array')
        checked_prerequisites = []
        for raw_prerequisite in prerequisites:
            prerequisite = object_value(raw_prerequisite, 'task prerequisite')
            checked_prerequisites.append({key: text(prerequisite.get(key), 'prerequisite ' + key)
                                          for key in ('label', 'href')})
        accepted.append(dict(id=task_id, title=title, goal=goal, fileIds=references,
                             steps=steps, notes=notes, commands=checked_commands,
                             prerequisites=checked_prerequisites))
    return accepted


def guide(title, folder, files, tasks):
    lines = [title + ' — offline resources', '=' * 40, '',
             '1. Extract this ZIP before opening or running files.',
             f'2. Open the extracted {folder} folder.',
             '3. Keep its files together. Follow the task prerequisites and steps below.',
             '4. Run commands from this folder unless a task explicitly says otherwise.',
             'Commands are instructions to review and run yourself; extracting this ZIP runs nothing.',
             'Existing README files contain additional setup details and limitations.', '', 'FILES', '-----']
    names = {}
    for item in files:
        names[item['id']] = item['name']
        lines += [f"{item['name']} [{item['role']}]", '  ' + item['description'], '']
    lines += ['TASKS', '-----']
    for index, task in enumerate(tasks, 1):
        lines += ['', f"{index}. {task['title']}", 'Goal: ' + task['goal']]
        if task['fileIds']:
            lines.append('Files: ' + ', '.join(names[file_id] for file_id in task['fileIds']))
        for prerequisite in task['prerequisites']:
            lines += ['Prerequisite: ' + prerequisite['label'], '  ' + prerequisite['href']]
        for number, step in enumerate(task['steps'], 1):
            lines.append(f'  {number}. {step}')
        for command in task['commands']:
            lines += ['', command['label'] + ':', '  ' + command['command'],
                      'Expected: ' + command['expected']]
        for note in task['notes']:
            lines.append('Note: ' + note)
    return ('\n'.join(lines).rstrip() + '\n').encode('utf-8')


def archive_bytes(folder, members):
    output = BytesIO()
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        for name, contents in sorted(members.items(), key=lambda pair: pair[0]):
            info = zipfile.ZipInfo(folder + '/' + name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_STORED
            info.comment = b''
            info.extra = b''
            archive.writestr(info, contents)
    return output.getvalue()


def plan_course(root, course_dir):
    manifest_path = regular_source(root, f'paths/{course_dir.name}/path.json')
    manifest = json_object(manifest_path)
    if manifest.get('status') == 'planned':
        return None
    if manifest.get('status') != 'ready':
        raise BundleError(f'Unsupported status in {manifest_path}')
    course_id = manifest.get('id')
    if not isinstance(course_id, str) or not SLUG.fullmatch(course_id) or course_id != course_dir.name:
        raise BundleError(f'Invalid course id in {manifest_path}')
    title = text(manifest.get('title'), 'course title')
    metadata_path = regular_source(root, f'paths/{course_id}/resources.json')
    resources = json_object(metadata_path)
    folder = resources.get('folder')
    if not isinstance(folder, str) or not SLUG.fullmatch(folder):
        raise BundleError('folder must be a portable lowercase hyphenated name')
    portable_component(folder)
    bundle = object_value(resources.get('bundle'), 'bundle')
    bundle_relative = relative_path(bundle.get('href'), 'bundle href')
    if (bundle_relative.parts[:2] != ('paths', course_id) or len(bundle_relative.parts) < 3
            or bundle_relative.suffix != '.zip'):
        raise BundleError('bundle href must be a ZIP within its course directory')
    output = root.joinpath(*bundle_relative.parts)
    if output.is_symlink():
        raise BundleError('Bundle output may not be a symlink')
    resolved_output = output.resolve()
    expected_course = root / 'paths' / course_id
    if not under(resolved_output, expected_course) or not under(resolved_output, root):
        raise BundleError('Bundle output escapes its course directory')
    if output.exists() and not output.is_file():
        raise BundleError('Bundle output must be a regular file')
    raw_files = resources.get('files')
    if not isinstance(raw_files, list) or not raw_files:
        raise BundleError('files must be a nonempty array')
    files, ids, used_names, members = [], set(), {START_NAME.casefold()}, {}
    for raw in raw_files:
        item = object_value(raw, 'resource file')
        file_id = text(item.get('id'), 'file id')
        if file_id in ids:
            raise BundleError(f'Duplicate file id: {file_id}')
        ids.add(file_id)
        href = item.get('href')
        path = regular_source(root, href)
        if path == resolved_output:
            raise BundleError('A bundle cannot include itself')
        name = relative_path(href, 'source href').name
        folded_name = unicodedata.normalize('NFC', name).casefold()
        if folded_name in used_names:
            raise BundleError(f'Duplicate flat filename: {name}')
        used_names.add(folded_name)
        role = text(item.get('role'), 'file role')
        description = text(item.get('description'), 'file description')
        files.append(dict(id=file_id, name=name, role=role, description=description))
        members[name] = source_bytes(path, name)
    tasks = normalize_tasks(resources, ids)
    members[START_NAME] = guide(title, folder, files, tasks)
    return output, archive_bytes(folder, members)


def build_bundles(root, *, check=False):
    root = Path(root).resolve(strict=True)
    paths = root / 'paths'
    if not paths.is_dir() or not under(paths.resolve(), root):
        raise BundleError('Repository paths directory is missing or escapes root')
    plans = []
    for course_dir in sorted(paths.iterdir(), key=lambda item: item.name):
        if course_dir.is_dir():
            plan = plan_course(root, course_dir)
            if plan is not None:
                plans.append(plan)
    # Validate and read every course before changing any bundle.
    for output, expected in plans:
        if check:
            if not output.is_file() or output.read_bytes() != expected:
                raise BundleError(f'Bundle missing or stale: {output.relative_to(root)}; run python scripts/build-bundles.py')
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            if output.is_file() and output.read_bytes() == expected:
                continue
            temp_path = None
            try:
                with tempfile.NamedTemporaryFile(dir=output.parent, prefix='.bundle-', delete=False) as temp:
                    temp_path = Path(temp.name)
                    temp.write(expected)
                os.replace(temp_path, output)
            finally:
                if temp_path is not None and temp_path.exists():
                    temp_path.unlink()
    return len(plans)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify exact ZIP bytes without writing')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1],
                        help='Repository root (default: parent of scripts directory)')
    args = parser.parse_args(argv)
    try:
        count = build_bundles(args.root, check=args.check)
    except (BundleError, OSError, RuntimeError) as error:
        print(f'Resource bundle error: {error}', file=sys.stderr)
        return 1
    print(f'{count} resource bundles {"verified" if args.check else "generated"}.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
