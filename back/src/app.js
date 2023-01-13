import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'


dotenv.config();
const server = express()
server.use(express.json())
server.use(cors())

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db; // armazena variavel para usar conexoes do mongoClient
const PORT = 5000;  
let hour = dayjs().format("HH:mm:ss")

//formato participante
//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos

//formato mensagem
//{from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}


try {
    await mongoClient.connect() //evita callbackhell -> esta é uma top lvl await
    db = mongoClient.db() 
    console.log("Conectado")
} catch (err) {
    console.log(err.message)
}



server.post("/participants", async (req,res) => {
    const { name } = req.body //recebe parametro name a ser cadastrado
    console.log(name);
    try {
        const userExist = await db.collection("participants").findOne({name})
        if (userExist) return res.status(409).send("Este usuário já existe") //impedir cadastro de usuario ja existente

        await db.collection("participants").insertOne({name: name, lastStatus: Date.now()}) // salvar na coleção participants
        await db.collection("messages").insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: hour
        })
        res.status(201).send("ok") //retornar status 201 pode retirar esse send ok 
    } catch (err) {
        console.log(err)
        res.status(500).send("Deu algo errado no servidor")
    }

    //necessario validar status 422 (name nao vazio) - joi
    //salvar a mensagem no formato acima usar dayjs


})

server.get("/participants", async (req,res) => {
  const participants = await db.collection("participants").find().toArray();
  return res.send(participants);
  // requisito get participants ok
})

server.post("/messages", (req,res) => {
    const { to, text, type } = req.body // recebe os parametros no body da request
    const from = req.headers.user // recebe os parametros do front (headers)
    console.log(to);
    console.log(text);
    console.log(type);
    console.log(from);

    try{
        db.collection("messages").insertOne({ from, to, text, type, time:hour}) // salvar time no formato requerido usando dayjs
        res.status(201).send("mensagem ok") // retornar status 201, tirar msg
        console.log(hour)
    } catch (err) {
        res.status(500).send("erro na msg")
    }
  //falta validar via joi status 422
})

server.get("/messages", (req,res) => {

})

server.post("/status", (req,res) => {

})


// function removeUser(){

// } // requisito remover usuário inativo lastStatus mais que 10 segundos atrás;


server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})