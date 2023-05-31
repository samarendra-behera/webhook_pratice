const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const axios = require('axios')

const {schoolModel} = require('./models/schoolModel')
const {studentModel} = require('./models/studentModel')

const app = express();
const PORT = 3100;

app.use(bodyParser.json())

dbUrl = "mongodb://localhost:27017/test_webhook";

mongoose.connect('mongodb://127.0.0.1:27017/test_webhook')
  .then(() => console.log('Mongoose default connection open to ' + dbUrl));

app.get('/', (req, res)=>{
    res.send('Welcome')
});

app.post('/register-school', async (req, res)=>{
    let data = req.body
    const index = await schoolModel.find().count()
    let schoolDetail = new schoolModel({
        schoolName:data.schoolName,
        schoolId:index + 1
    })
    let schoolData = await schoolDetail.save()
    
    res.send({
        result: schoolData
    })
})

app.post('/add-webhook-event', async (req, res)=>{
    let data = req.body

    let schoolDetail = await schoolModel.findOne({schoolId:data.schoolId})
    if(schoolDetail){
        if(schoolDetail.webhookDetails == null){
            schoolDetail.webhookDetails = [];
        }
        schoolDetail.webhookDetails.push({
            eventName: data.eventName,
            endpointUrl: data.endpointUrl
        })
        schoolDetail = await schoolModel.findOneAndUpdate({schoolId:schoolDetail.schoolId}, schoolDetail, {returnOriginal:false})
    }
    else{
        res.status(404).send({'message': 'School is not found'})
    }
    res.status(201).send({
        result: schoolDetail
    })
})

app.post('/add-student', async (req, res)=>{
    data = req.body

    schoolDetail = await schoolModel.findOne({schoolId:data.schoolId})
    console.log(schoolDetail.schoolId)
    let studentData = {}
    if(schoolDetail){
        const studentDetail = new studentModel({
            name: data.name,
            age: data.age,
            schoolId: data.schoolId
        })
        studentData = await studentDetail.save()
        let = webhookUrl = "";
        for(let i = 0; i < schoolDetail.webhookDetails.length; i++){
            if(schoolDetail.webhookDetails[i].eventName == "newStudentAdd"){
                webhookUrl = schoolDetail.webhookDetails[i].endpointUrl
            }
        }
        if(webhookUrl != null && webhookUrl.length > 0){
            let result = await axios.post(webhookUrl, studentData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            console.log("webhook data send")
        }
    }
    else{
        res.status(404).send({'message': 'School is not found'})
    }
    res.status(201).send({
        name: studentData.name
    })
    
})

app.delete('/delete-student', async (req, res)=>{
    data = req.body
    let studentDetail = await studentModel.findOne({_id:data.id})
    if(studentDetail.name){
        schoolDetail = await schoolModel.findOne({schoolId: studentDetail.schoolId})
        if (schoolDetail){
            webhookUrl = ""
            for(i=0; i<schoolDetail.webhookDetails.length; i++){
                if(schoolDetail.webhookDetails[i].eventName == 'studentRemove'){
                    webhookUrl = schoolDetail.webhookDetails[i].endpointUrl
                }
            }
            if(webhookUrl != null && webhookUrl.length > 0){
                let result = await axios.post(webhookUrl, {name:studentDetail.name},{
                    headers:{
                        'Content-Type': 'application/json',
                    }
                })
                console.log("webhook data send")
                await studentModel.findOneAndDelete({_id:studentDetail._id})
                res.status(301).send({
                    message: 'Student delete successfully'
                })
            }

        }else{
            res.status(400).send({'message': 'School is not found'})
        }
    }else{
        res.status(400).send({'message': 'Student is not found'})
    }
    
})

app.listen(PORT, ()=>{
    console.log(`Server running at: http://localhost:${PORT}/`);
})
