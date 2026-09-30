"use strict";
const byId=id=>document.getElementById(id);
const input=byId("lesson-title"),error=byId("title-error"),status=byId("status"),list=byId("lessons"),dialog=byId("preview-dialog"),opener=byId("preview");
let count=0;
byId("lesson-form").addEventListener("submit",event=>{
 event.preventDefault();const title=input.value.trim();
 if(!title){input.setAttribute("aria-invalid","true");error.textContent="Title is required. Enter a meaningful lesson name.";input.focus();return;}
 input.removeAttribute("aria-invalid");error.textContent="";
 const row=document.createElement("li");row.textContent=title;list.append(row);count++;
 status.textContent=`Added ${title}. ${count} lesson${count===1?"":"s"} in this in-memory plan.`;
 input.value="";input.focus();
});
opener.addEventListener("click",()=>{byId("preview-summary").textContent=count?`${count} lesson${count===1?"":"s"} ready to study. Reloading clears this in-memory lab.`:"Your plan is empty. Close this preview and add a lesson.";dialog.showModal();byId("dialog-title").focus();});
dialog.addEventListener("close",()=>opener.focus());
