const express = require('express');
const bodyParser = require('body-parser')

const app = express();
const PORT = 4100;

app.use(bodyParser.json())

app.get('/',(req, res)=>{
    res.send({
        'message':'Welcome to Papun School'
    })
})

app.post('/webhook/student-added', (req, res)=>{
    data = req.body

    console.log(data)
    res.send('Webhook data recieved')
})

app.post('/webhook/student-remove', (req, res)=>{
    data = req.body

    console.log(data)
    res.send(`The Student which name is ${data.name} out of our school`)
})


app.listen(PORT, ()=>{
    console.log(`Server running at: http://localhost:${PORT}/`);
})
