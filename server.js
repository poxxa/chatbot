const express = require('express');
const server = express();
server.all('/',(req,res)=>{
  res.send("챗봇이 활성화중입니다.");
})
function keepAlive() {
  server.listen(3000, ()=>{ console.log("서버가 준비되었습니다.") })
}
module.exports = keepAlive;