# Optional real Linux observation sheet

On Windows, run the portable Python kit in PowerShell. If WSL is already installed, open your distribution from Start or run `wsl` in PowerShell, then use its Linux Bash terminal for commands below. You can check existing distributions with `wsl --list --verbose`. These are not PowerShell snippets.

Use an **existing disposable Linux/WSL user environment**. Do not install or
enable services on the host for this lab. Bash commands do not run in PowerShell.
Record distribution, versions, exact output and any unavailable commands.

```
uname -s
cat /etc/os-release
pwd
id
command -v python3
python3 --version
ps -p $$ -o pid,ppid,vsz,rss,comm
cat /proc/self/cgroup
ls -l /proc/self/ns
ss -ltn
systemctl --user --failed
```

Expected: Linux identity, your own working directory/user/interpreter, current
shell process values, and available namespace/cgroup/listener observations.
Exact numbers differ. systemctl may report no user manager; that is a valid
environment limit. ss may be absent. Do not use sudo to force observations.
Redact host/user details before sharing an incident record.

For file/stream practice create `notebook-lab` in your user working directory:

```
mkdir -p notebook-lab/input
cd notebook-lab
printf 'id,name
1,Asha
' > input/sample.csv
cp input/sample.csv backup.csv
chmod 600 backup.csv
ls -l backup.csv
printf 'INFO ready
ERROR invalid row
' | grep ERROR
```

Expected: a two-line CSV; owner read/write mode on backup.csv; one ERROR line.
Inspect every target first. Keep all practice writes in this folder. Cleanup
after reviewing your directory: remove only `input/sample.csv` and `backup.csv`,
then remove the now-empty input directory and notebook-lab with `rmdir`.
Do not use recursive deletion. Do not terminate processes you did not launch.

Portfolio questions: Does your working directory explain a relative-path error?
Does each parent permit traversal? How does namespace view differ from resource
budget? Which observations prove an application is healthy, beyond listening?
This sheet was authored and reviewed; commands need execution on your Linux
environment before you claim platform evidence.

Optional setup reference: https://learn.microsoft.com/en-us/windows/wsl/install . Installation is not required for portable tests and was not performed in this task.
