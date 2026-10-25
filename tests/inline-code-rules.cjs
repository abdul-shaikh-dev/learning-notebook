// Shapes of inline code in lesson prose. Outside backticks, these are almost always unmarked code.
const FILE_EXT='py|js|mjs|cjs|ts|tsx|jsx|json|md|csv|txt|sql|cs|csproj|sln|yaml|yml|sh|ps1|html|css|toml|ini|cfg|env|xml|log|lock';
const ARGS=String.raw`\((?:[^()\s]|, |"[^"]*"|'[^']*'|\([^()]*\))*\)`;
const SQL='SELECT FROM WHERE UPDATE INSERT DELETE MERGE ORDER GROUP BY HAVING JOIN LEFT RIGHT INNER OUTER CROSS APPLY UNION EXCEPT INTERSECT DISTINCT TOP CASE WHEN THEN ELSE END NULL IS NOT EXISTS IN AND OR AS ON WITH OVER PARTITION ROWS RANGE BETWEEN UNBOUNDED PRECEDING FOLLOWING CURRENT ROW COUNT SUM AVG MAX MIN LAG LEAD RANK DENSE_RANK ROW_NUMBER COALESCE NULLIF CAST TRY_CONVERT CONVERT QUOTENAME YEAR BEGIN TRAN TRANSACTION COMMIT ROLLBACK TRY CATCH THROW GO EXEC CREATE ALTER TABLE PROCEDURE INDEX VIEW SET NOCOUNT XACT_ABORT XACT_STATE @@TRANCOUNT @@ROWCOUNT INCLUDE CHECK INTO VALUES NOLOCK SERIALIZABLE SNAPSHOT READ COMMITTED UNCOMMITTED READ_COMMITTED_SNAPSHOT ISOLATION LEVEL'.split(' ');
// A run of SQL keywords counts as code when it holds at least one keyword that is not also an ordinary capitalised word.
const SQL_RUN=new RegExp(String.raw`(?<![\w@\`])(?:${SQL.join('|')})(?: (?:${SQL.join('|')}))*(?![\w\`])`);
const WEAK=new Set('IS NOT IN AND OR AS ON WITH SET END GO TOP CHECK ROWS RANGE TRY CURRENT ROW READ YEAR CASE INDEX VIEW LEVEL BY'.split(' '));
const PATTERNS=[
 ['call',new RegExp(String.raw`(?<![\w.\`])[A-Za-z_$][\w.$]*${ARGS}`)],
 ['snake_case',/(?<![\w`.])_*[a-z][a-z0-9]*_[a-z0-9_]+(?![\w`])/],
 ['file',new RegExp(String.raw`(?<![\w\`/.])[\w./-]*[\w-]\.(?:${FILE_EXT})(?![\w\`])`)],
 ['flag',/(?<![\w`-])--?[a-z][a-z0-9-]*/],
 ['camelCase',/(?<![\w`.])[a-z]+[A-Z][A-Za-z0-9]*(?![\w`])/],
 ['setting',/(?<![\w`])[a-z][a-z_]{2,}[A-Za-z_]*=-?[\w-]+(?:\.\d+)?/],
 ['dotted',/(?<![\w`.])[A-Za-z_]\w*\.[A-Za-z_]\w*(?:\.\w+)*(?![\w`])/],
 ['exception',/(?<![\w`.])(?:[A-Z][A-Za-z]*(?:Error|Exception)|TimeoutExpired|StopIteration|KeyboardInterrupt|SystemExit|CancelledError)(?![\w`])/],
 ['git',/(?<![\w`.])git (?:add|bisect|branch|checkout|cherry-pick|clone|commit|config|diff|fetch|init|log|merge|merge-base|pull|push|rebase|remote|reset|restore|rev-parse|revert|show|stash|status|switch|tag|worktree)\b/],
 ['sql',SQL_RUN]
];
// Allowed prose: maths notation, product names and terms that only look like code.
// An entry is a token or a /pattern/, optionally limited to one course as "course-id: entry".
const allow=require('./inline-code-allow.json').map(a=>{const m=a.match(/^([a-z0-9-]+): (.*)$/s);return {course:m?.[1],entry:m?m[2]:a};});
const allowed=(token,course)=>allow.some(a=>(!a.course||a.course===course)&&(a.entry.startsWith('/')?new RegExp('^'+a.entry.slice(1)+'$').test(token):a.entry===token));
// Marked spans become backticks, which every pattern refuses to touch, so text beside a span is judged on its own.
const blank=t=>t.replace(/`[^`]*`/g,m=>'`'.repeat(m.length));
function findings(text,course){
 const plain=blank(text),out=[];
 for(const [kind,re] of PATTERNS)for(const m of plain.matchAll(new RegExp(re.source,'g'))){
  const token=m[0];
  if(kind==='sql'&&token.split(' ').every(w=>WEAK.has(w)))continue;
  if(!allowed(token,course))out.push({kind,token,index:m.index,end:m.index+token.length});
 }
 return out;
}
module.exports={findings,PATTERNS,blank,allowed};
