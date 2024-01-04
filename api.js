const express=require("express")
const app=express()
const {Readable}=require("stream")
const mongoose=require("mongoose")
require("dotenv").config('./env')
const cors=require("cors")
const multer=require("multer")
const port=3000

app.use(cors())
app.use(express.json())

// test endpoint
app.get("/questions",(req,res)=>{
    res.json("test app")
})

// database
mongoose.connect().then(()=>{
    console.log("Database connected!!")
}).catch(err=>console.log(err,"database failed to connect!"))

const storage=multer.memoryStorage()
const upload=multer({storage:storage})

app.post("/upload",upload.array('pdfs',100),async(req,res)=>{
    const files=req.files

    try{
        const database=mongoose.database("zerity")
        const collections=database.collections('pdfs')
        const insertResult=await Promise.all(
            files.map(async(file)=>{
                const {originalname,buffer}=file
                const readablePdfStream=new Readable();
                readablePdfStream.push(buffer);
                readablePdfStream.push(null);

                return collections.insertOne({
                    name:originalname,
                    pdf:readablePdfStream
                })

            })
        )

        // inserting ids
        const insertedIds=insertResult.map((result)=>result.insertedId)

        res.status(201).json({success:true,fileIds:insertedIds})

    }catch(err){
        res.status(500).json({err:"upload failed"})

    }
    
})


app.listen(port,(err)=>{
    if(err) throw new Error("Server is asleep")
    console.log(`server is up on port : ${port}`)
})