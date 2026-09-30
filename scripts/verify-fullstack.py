"""Build the journey in a temporary directory and test its real HTTP boundary."""
import argparse, importlib.util, json, os, shutil, socket, subprocess, tempfile, time, urllib.request, uuid
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--framework',default='net10.0')
parser.add_argument('--sql-server',help='Optional owned local SQL Server instance; creates/removes a uniquely named test database.')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'paths/full-stack-journey/practice'
sqlcmd=shutil.which('sqlcmd')
database='NotebookJourneyTest_'+uuid.uuid4().hex
if args.sql_server and not sqlcmd:raise RuntimeError('sqlcmd required for SQL verification')
def sql(query=None,file=None):
    command=[sqlcmd,'-S',args.sql_server,'-E','-C','-b','-d','master' if query else database]
    command+=['-Q',query] if query else ['-i',str(file)]
    subprocess.run(command,check=True,timeout=45)

with tempfile.TemporaryDirectory(prefix='notebook-fullstack-') as scratch:
    work=Path(scratch)
    for file in SOURCE.iterdir():
        if file.is_file():shutil.copyfile(file,work/file.name)
    project=work/'Planner.csproj'
    project.write_text(project.read_text().replace('net10.0',args.framework),encoding='utf-8')
    subprocess.run(['dotnet','build','Planner.csproj','-c','Release','--nologo','-p:TargetFramework='+args.framework],cwd=work,check=True,timeout=240)
    npm=shutil.which('npm.cmd') or shutil.which('npm')
    subprocess.run([npm,'ci','--ignore-scripts'],cwd=work,check=True,timeout=180)
    for action in ['test','build']:subprocess.run([npm,'run',action],cwd=work,check=True,timeout=120)
    spec=importlib.util.spec_from_file_location('journey_acceptance',work/'acceptance.py')
    acceptance=importlib.util.module_from_spec(spec);spec.loader.exec_module(acceptance)
    with socket.socket() as probe:probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
    address=f'http://127.0.0.1:{port}'
    def run_host(connection=None,existing_id=None):
        env=os.environ.copy();env.pop('PlannerConnection',None)
        if connection:env['PlannerConnection']=connection
        with (work/'host.log').open('w+',encoding='utf-8') as log:
            host=subprocess.Popen(['dotnet',str(work/'bin/Release'/args.framework/'Planner.dll'),'--urls',address],cwd=work,env=env,stdout=log,stderr=subprocess.STDOUT)
            try:
                deadline=time.monotonic()+30
                while True:
                    if host.poll() is not None:raise RuntimeError('API exited before readiness')
                    try:
                        with urllib.request.urlopen(address+'/health',timeout=1) as response:
                            health=json.load(response)
                            if health['storage']!=('sql-server' if connection else 'memory'):raise AssertionError(health)
                            break
                    except (OSError,TimeoutError):
                        if time.monotonic()>deadline:raise TimeoutError('API startup timed out')
                        time.sleep(.1)
                if existing_id:
                    with urllib.request.urlopen(address+'/api/tasks',timeout=5) as response:rows=json.load(response)
                    assert any(row['id']==existing_id and row['version']==2 for row in rows),'SQL record did not persist after restart'
                    print('PASS: SQL task/version persisted after API restart')
                    return existing_id
                return acceptance.check(address)
            except BaseException:
                log.flush();log.seek(0);print(log.read());raise
            finally:
                host.terminate()
                try:host.wait(timeout=10)
                except subprocess.TimeoutExpired:host.kill();host.wait()
    run_host()
    if args.sql_server:
        assert database.startswith('NotebookJourneyTest_') and database.replace('_','').isalnum()
        created=False
        try:
            sql(f'CREATE DATABASE [{database}]');created=True
            sql(file=work/'schema.sql')
            connection=f'Server={args.sql_server};Database={database};Integrated Security=True;Encrypt=True;TrustServerCertificate=True'
            task_id=run_host(connection)
            run_host(connection,task_id)
        finally:
            if created:sql(f'ALTER DATABASE [{database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{database}]')
    print('PASS: full-stack build, frontend contracts and real .NET HTTP checks'+('; real SQL concurrency and persistence' if args.sql_server else '; SQL mode not executed in this run'))
