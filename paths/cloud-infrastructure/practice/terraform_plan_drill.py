"""Real Terraform CLI, built-in terraform_data only; local disposable state."""
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


def main():
    binary = shutil.which('terraform')
    if not binary:
        raise SystemExit('SKIP: Terraform 1.4+ required; no Terraform/cloud action was run')
    # Do not inherit injected CLI flags, workspaces or data directories.
    env = {k: v for k, v in os.environ.items() if not k.startswith('TF_')}
    env['CHECKPOINT_DISABLE'] = '1'
    with tempfile.TemporaryDirectory(prefix='notebook-tf-') as folder:
        root = Path(folder).resolve()
        config = {'terraform': {'required_version': '>= 1.4.0, < 2.0.0'},
                  'resource': {'terraform_data': {'sample': {'input': 'v1', 'triggers_replace': 'identity-1'}}}}

        def write():
            (root / 'main.tf.json').write_text(json.dumps(config), encoding='utf-8')

        def run(*args, codes=(0,)):
            result = subprocess.run([binary, *args], cwd=root, env=env,
                                    capture_output=True, text=True, timeout=90)
            if result.returncode not in codes:
                raise RuntimeError(result.stderr or result.stdout)
            return result

        def plan(expected):
            result = run('plan', '-input=false', '-no-color', '-detailed-exitcode',
                         '-out=review.tfplan', codes=(0, 2))
            data = json.loads(run('show', '-json', 'review.tfplan').stdout)
            change = next(x for x in data['resource_changes'] if x['address'] == 'terraform_data.sample')
            actions = change['change']['actions']
            assert actions == expected, (actions, expected)
            assert result.returncode == (0 if expected == ['no-op'] else 2)
            print('PASS plan:', actions, 'exit:', result.returncode)

        write()
        run('init', '-backend=false', '-input=false', '-no-color')
        plan(['create'])
        # This configuration contains no provider, provisioner, backend or cloud resource.
        run('apply', '-input=false', '-no-color', 'review.tfplan')
        plan(['no-op'])
        config['resource']['terraform_data']['sample']['input'] = 'v2'
        write()
        plan(['update'])
        config['resource']['terraform_data']['sample']['triggers_replace'] = 'identity-2'
        write()
        plan(['delete', 'create'])
        # Replacement and update plans are deliberately not applied.
    print('PASS: only local built-in state applied; temporary directory removed')


if __name__ == '__main__':
    main()
