const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");

const port = 5000
// middleware
app.use(cors());
app.use(express.json());

app.get('/api',(req,res)=>{
    console.log("Hello World");
    res.json({message:'Hello World'})
})
app.get('/api/nothing',(req,res)=>{
    res.json({message:'Nothing'})
})

app.listen(port,()=>{
    console.log("http://localhost:"+port);
})