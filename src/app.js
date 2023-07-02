import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs'
dotenv.config();

const participantsSchema = joi.object({
    name: joi.string().required()
})

const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;


try{
    await mongoClient.connect()
    db = mongoClient.db()
} catch (error) {
    console.error(error)
    console.log('nao conseguiu se conectar ao servidor')

}

 

//O formato de um participante deve ser:
//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos



//endpoints

 server.post('/participants', async (req, res) => {
    const { name } = req.body
    const { error } = participantsSchema.validate({ name }, {abortEarly: false})

    if(error){
        return res.status(422).send('Unprocessable Entity')
    } 

    const datenow = Date.now()

    try{
       const duplicate = await db.collection("participants").findOne({name: name})
       if(duplicate){
        return res.status(409).send('Conflict')
       }

       await db.collection("participants").insertOne({name: name, lastStatus: datenow })

       await db.collection("messages").insertOne({
        from: name,
        to: 'Todos',
        text: 'Entrou na sala...',
        type: 'status',
        time: dayjs().format("HH:mm:ss")
       })

       res.status(201).send('Created')
       // O formato de uma mensagem deve ser:
// {from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}

    } catch (error) {
        res.sendStatus(500)
    }

});

server.get('/participants', async (req, res) => {
    try {
        const everyone = await db.collection("participants").find().toArray()
        res.send(everyone)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }


});

// server.post('/messages', (req, res) => {

// });

// server.get('/messages', (req, res) => {

// });

// server.post('/status', (req, res) => {

// });


const PORT = 5000

server.listen(PORT, () => {
    console.log("Rodando");
  });
  
  //fuser -k 4000/tcp//