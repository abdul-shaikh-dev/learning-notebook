# SQL conflict tests

`tests/sql-conflicts.py` checks the SQL Server course's event-classification answer key. It covers a baseline import, an exact replay and six byte-exact conflict cases. It also checks that the lesson and capstone answer keys contain the same classifier. It uses only connection-local temporary tables in `tempdb` and creates no databases or permanent tables.

## In CI

The `sql-server` job in `.github/workflows/pages.yml` starts a throwaway `mcr.microsoft.com/mssql/server:2022-latest` container (Developer edition) with a random SA password generated for that run. The password is masked in logs and passed to `sqlcmd` only through `SQLCMDPASSWORD`. The job runs the test with the `sqlcmd` shipped in the image, through `docker exec`. Host `/tmp` is mounted so the generated script is readable inside the container. The job has a 10-minute limit, and `deploy` waits for it.

## Locally

Against a local SQL Server with Windows authentication:

```
python -B tests/sql-conflicts.py --server .\SQLEXPRESS
```

Against the same container image as CI, on a machine with Docker and `sqlcmd` (the password is an example; choose your own and keep it out of the command line where you can):

```
docker run -d --name sql -p 1433:1433 -e ACCEPT_EULA=Y -e MSSQL_PID=Developer -e MSSQL_SA_PASSWORD=<password> mcr.microsoft.com/mssql/server:2022-latest
export SQLCMDPASSWORD=<password>        # PowerShell: $env:SQLCMDPASSWORD = '<password>'
python -B tests/sql-conflicts.py --server localhost --user sa --trust-server-certificate
docker rm -f sql
```

`--user` reads the password only from `SQLCMDPASSWORD` and stops with an error if it is missing. `--trust-server-certificate` accepts the container's self-signed certificate. On Windows the script asks `sqlcmd` to read the file as UTF-8 (`-f 65001`); Linux `sqlcmd` reads UTF-8 by default.
