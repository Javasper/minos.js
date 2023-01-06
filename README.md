A very small clone of Axios containing only one feature. 
You can send an ajax request (just like you could with Axios or Ky) with Minos like this. 


requestType: the type of request. Can be "post", "get" or "put".  
addressName: the route name of the address you are sending your Ajax requset to.
dataType: the type of data you are sending over: usually its "json".
data: the data itself. If "json",  then it is a JSON variable. 
.json(): add json at the end of minos.post to get that JSON promised that gets returned. 

Examples

let p = await minos.post("/post", {json:{name:"NAME POST"}}).json();
console.log(p.name);
 


let g = await minos.get("/get").json();
console.log(g.name);
 

 
let put = await minos.put("/put", {json:{name:"NAME GET"}}).json();
console.log(put.name);
 



