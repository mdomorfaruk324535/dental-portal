const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
const { MongoClient, ServerApiVersion } = require("mongodb");
const fileUpload = require("express-fileupload");
const dns = require("node:dns/promises");
require("dotenv").config();

dns.setServers(["1.1.1.1"]);

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ayqqby4.mongodb.net/?appName=Cluster0`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.connect().then(connectedClient => {
    const appointments = client.db("doctorsPortal").collection("appointments");
    const doctors = client.db("doctorsPortal").collection("doctors");

    app.post("/addAppointment", (req, res) => {
        const appointment = req.body;
        appointment.status = 'pending';
        appointment.hasPrescription = false;
        appointments.insertOne(appointment).then(result => {
            res.send(result.insertedId);
        })
    });

    app.get("/appointments", (req, res) => {
        appointments.find({}).sort({ _id: -1 }).toArray()
            .then(documents => {
                res.send(documents);
            }).catch(error => {
                console.log('[appointments]', error.message);
            })
    })

    app.post("/appointmentsByDate", (req, res) => {
        const { date, email } = req.body;

        doctors.find({ email: email }).toArray()
            .then(doc => {
                const filter = {date: new Date(date).toDateString()};

                if (doc.length === 0) {
                    filter.email = email;
                    appointments.find(filter).toArray()
                        .then(result => {
                              res.send(result);
                        }).catch(error => {
                            console.log('[appointmentsByDate]', error.message);
                        })
                        return 0;
                }

                appointments.find(filter).toArray()
                        .then(result => {
                            res.send(result);
                        }).catch(error => {
                            console.log('[appointmentsByDate]', error.message);
                        })
            })

    })

    app.post("/isDoctor", (req, res) => {
        const email = req.body.email;
        doctors.find({email: email}).toArray()
        .then(doc => {
            res.send(doc.length > 0);
        })
    })

    app.post("/addADoctor", (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        
        const newImg = file.data;
        const encImg = newImg.tostring('base64');

            const image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer.from(encImg, 'base64'),
            }

            doctors.insertOne({ name: name, email: email, phone: phone, img: image })
                .then(result => {
                    if (result.insertedId) {
                        res.send("sended")
                    } else {
                        res.send(false);
                    }
                })

    });

    app.get('/doctors', (req, res) => {
        doctors.find({}).toArray()
            .then(result => {
                res.send(result);
            }).catch(error => {
                res.status(5000).send("Something Wrong!")
            })
    })

    console.log('Database Connected');
}).catch(error => {
    console.log(error.message);
})


const port = 3000;

app.get("/", (req, res) => {
    res.send("Hello World")
});

app.listen(port, () => {
    console.log(`Listening to PORT: ${port}`);
})