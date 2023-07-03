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

const messagesSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("private_message", "message")

})

const limitSchema = joi.number().min(1)
const datenow = Date.now()


const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;


try {
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
    const { error } = participantsSchema.validate({ name }, { abortEarly: false })

    if (error) {
        return res.status(422).send('Unprocessable Entity')
    }

   
    try {
        const duplicate = await db.collection("participants").findOne({ name: name })
        if (duplicate) {
            return res.status(409).send('Conflict')
        }

        await db.collection("participants").insertOne({ name: name, lastStatus: datenow })

        await db.collection("messages").insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
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
        res.status(201).send(everyone)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }


});

server.post('/messages', async (req, res) => {
    const { to, text, type } = req.body
    const { user } = req.headers

    const { error } = messagesSchema.validate({ from: user, to, text, type }, { abortEarly: false })

    if (error) {
        return res.status(422).send('Unprocessable Entity')
    }

    try {
       const checkingUser =  await db.collection("participants").findOne({ name: user})
       if(!checkingUser) return res.status(422).send('Unprocessable Entity')

        await db.collection("messages").insertOne({
            from: user,
            to,
            text ,
            type ,
            time: dayjs().format("HH:mm:ss")
        })

        res.status(201).send('Created')

    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }

});

server.get('/messages', async (req, res) => {
    const { user } = req.headers
    const limit = Number(req.query.limit)

    try{
        const messages = await db.collection("messages").find(
            {
                $or: [
                    {from: user},
                    {to: { $in: ['Todos', user]}},
                    {type: "message"}
                ]
            }
        ).limit(limit).toArray()

        if(limit){
            if (limit <= 0 || isNaN(limit) )  
                return res.status(422).send('Unprocessable Entity')

            return res.send(messages.slice(-limit))
        }
        res.send(messages)

    }catch(error) {
        console.error(error)
        res.sendStatus(500)
    }


});

server.post('/status', async (req, res) => {

    const {user} = req.headers

    try{
        const userExists = await db.collection("participants").findOne({ name: user })
        if (!userExists) return res.status(404).send('Not Found')


        await db.collection("participants").updateOne({ name: user }, { $set: {lastStatus: Date.now() }})
        res.status(200).send('Created')

    }catch(error) {
        console.error(error)
        res.sendStatus(500)
    }

});


setInterval (async () => {
    const seconds = Date.now() - 10000
    try{
       const inactives = await db.collection("participants").find({
        lastStatus: {$lte: seconds}
       }).toArray()


       if(inactives.length > 0){
        const inactiveMessages = inactives.map((participant) => {
            return {
                
                    from: participant.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs().format('HH:mm:ss')
            }

        })
        await db.collection("messages").insertMany(inactiveMessages)
        await db.collection("participants").deleteMany({lastStatus: {$lte: seconds}})
        
       }
        
    }catch(error) {
        console.error(error)
        res.Status(500).send('Erro no set interval')
    }



})

const PORT = 5000

server.listen(PORT, () => {
    console.log("Rodando")
});

  //fuser -k 4000/tcp//