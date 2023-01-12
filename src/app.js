import express, { application } from "express"
import cors from "cors"
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'


dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;
const PORT = 5000;  

//formato participante
//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos

//formato mensagem
//{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}


try {
    await mongoClient.connect()
    db = mongoClient.db() 
} catch (err) {
    console.log("Erro no server")
}

const server = express()
server.use(express.json())
server.use(cors())


server.post("/participants", (req,res) => {
    const { name } = req.body //recebe parametro name a ser cadastrado
})

server.get("/participants", (req,res) => {

})

server.post("/messages", (req,res) => {

})

server.get("/messages", (req,res) => {

})

server.post("/status", (req,res) => {

})

server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})