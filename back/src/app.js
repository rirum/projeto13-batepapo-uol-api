import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import { MongoClient, ReturnDocument } from 'mongodb'
import dayjs from 'dayjs'
import joi from 'joi'


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
//valida user sem string
const userSchema = joi.object({
    name: joi.string().required()
})

//valida mensagem to text type
const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message').required()
})

//// inicio http verbs
server.post("/participants", async (req,res) => {
    const { name } = req.body //recebe parametro name a ser cadastrado
    console.log(name);

    const userValidate = userSchema.validate({name}) //validaçao 422
    if (userValidate.error){
        return res.sendStatus(422)
    }

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


 


})

server.get("/participants", async (req,res) => {
  const participants = await db.collection("participants").find().toArray();
  return res.send(participants);
  // requisito get participants ok
})

server.post("/messages", async (req,res) => {
    const { to, text, type } = req.body // recebe os parametros no body da request
    const from  = req.headers.user // recebe os parametros do front (headers)
    console.log(to);
    console.log(text);
    console.log(type);
    console.log(from);
    const messageValidate = messageSchema.validate({to, text, type})

    if(messageValidate.error){
        return res.sendStatus(422)
    }

    if (!await db.collection("participants").findOne({ name: from })){
        return res.status(422).send("Participante inexistente")
    }

    try{
        db.collection("messages").insertOne({ from, to, text, type, time:hour}) // salvar time no formato requerido usando dayjs
        res.status(201).send("mensagem ok") // retornar status 201, tirar msg
        console.log(hour)
    } catch (err) {
        res.status(500).send("erro na msg")
    }
//requisito post message ok
})

server.get("/messages", async (req,res) => {
    const limit = parseInt(req.query.limit)
    try{
        const message = await db.collection("messages").find().toArray();
        if (!limit) return res.send(message.reverse());
        res.send(message.slice(-limit).reverse());
    }catch(err){
        res.status(500).send("erro no get msg");
    }
})

server.post("/status", async (req,res) => {
    const user = req.headers.user; // recebe requisição user
    try{
        
        const participantIsOnline = await db.collection("participants").findOne({ name:user })
        if (!participantIsOnline) return res.status(404).send("Esse usuário não existe!")
    } catch(err) {
        return res.status(500).send("erro no post status")
    }
})


function removeUser(){
    setInterval(async () => {

        const lastStatusLoggedOff = Date.now() - 10000 //milissegundos
        const usersLogged = await db.collection("participants").find().toArray()

        usersLogged.forEach(async i =>{
            if (i.lastStatus < lastStatusLoggedOff){
                await db.collection("participants").deleteOne({name: i.name})
                
                await db.collection("messages").insertOne({
                    from: i.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type:'status',
                    time: hour
                })
            }
        })
    }, 15000)
} // requisito remover usuário inativo lastStatus mais que 10 segundos atrás;

removeUser()
server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})