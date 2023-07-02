import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
 .then(() => db = mongoClient.db())
 .catch((err) => console.log(err.message));



//O formato de um participante deve ser:
//{name: 'João', lastStatus: 12313123} // O conteúdo do lastStatus será explicado nos próximos requisitos
// O formato de uma mensagem deve ser:
// {from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'}


//endpoints

// server.post('/participants', (req, res) => {

// });

// server.get('/participants', (req, res) => {

// });

// server.post('/messages', (req, res) => {

// });

// server.get('/messages', (req, res) => {

// });

// server.post('/status', (req, res) => {

// });

server.listen(5000, () => {
    console.log("Rodando em http://localhost:5000");
  });
  
  //fuser -k 4000/tcp//