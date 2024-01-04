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


// mong model
const pdfSchema = new mongoose.Schema({
    name: String,
    pdf: Buffer,
});
const PdfModel = mongoose.model('Pdf', pdfSchema);


const storage=multer.memoryStorage()
const upload=multer({storage:storage})

app.post("/upload",upload.array('pdfs',100),async(req,res)=>{
    const files=req.files

    if(!files|| files.length < 0){
        res.status(401).json({err:"No file uploaded"})
    }

    try{
        const insertPdf=await files.map(async(file)=>{
            const readablePdfStream=new Readable();
            readablePdfStream.push(file.buffer)
            readablePdfStream.push(null)

            const pdfDoc=new PdfModel({
                name:file.originalname,
                pdf:file.buffer
            })

            await pdfDoc.save();

            return pdfDoc._id;

        })

        const insertedIds = await Promise.all(insertPdf);
        res.json({ success: true, fileIds: insertedIds });

    }catch(err){
        res.status(500).json({err:"upload failed"})

    }
    
})

// download route endpoint
app.get("download/:fileId",async(req,res)=>{
    const fileId=req.params.fileId
    try {
        const pdfDoc = await PdfModel.findById(fileId);
    
        if (!pdfDoc) {
        return res.status(404).json({ error: 'PDF not found.' });
        }
    
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfDoc.pdf);

    }catch(err){
        console.log(err,"faild to download file")
        res.status(500).json({err:"something went wrong at download route"})
    }
})


app.listen(port,(err)=>{
    if(err) throw new Error("Server is asleep")
    console.log(`server is up on port : ${port}`)
})