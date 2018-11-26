const express = require('express')
const path = require('path')
const url = require('url');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .post('/user/:username', async (req, res) => {
    try {
      const client = await pool.connect()
      
      var decoded = new Buffer(req.headers.authorization, 'base64').toString('ascii')
      console.log("decoded = " + decoded)
      var splitedStrs = decoded.split(":")
      var password = ""
      if(splitedStrs.length > 1) {
        password = splitedStrs[1]
      }
      var queryStr = 'SELECT T_USER.ID, USER_NAME, T_USER.ROLE, T_USERROLE.ROLE_NAME, PHONE, EMAIL FROM T_USER, T_USERROLE WHERE USER_NAME=$1 AND PASSWORD=$2 AND T_USER.ROLE = T_USERROLE.ID'
      const user = await client.query(queryStr, [req.params.username, password]);
      console.log("user = " + user.rowCount)
      const exsit = (user.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' });   
        const result = new Object()
        result.userInfo = user.rows
        result.code = 200
        result.message = "Login successful" 
        res.write(JSON.stringify(result));  
        res.end();
      } else {
        const result = new Object()
        result.code = 401
        result.message = "User does not exist" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Login failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .post('/user', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM T_USER WHERE USER_NAME=$1'
      const user = await client.query(queryStr, [req.body.user_name]);
      console.log(JSON.stringify(user))
      const exsit = (user.rowCount > 0) ? true : false
      console.error("exsit="+exsit)
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const result = new Object()
        result.code = 403
        result.result = false
        result.message = "Username have exsited"
        res.write(JSON.stringify(result))
        res.end()
      } else {
        var insertStr = 'INSERT INTO T_USER(USER_NAME, PASSWORD, ROLE, PHONE, EMAIL) VALUES ($1, $2, $3, $4, $5)'
        var username = req.body.user_name
        var password = req.body.password
        var phone = req.body.phone
        var email = req.body.email
        var role = req.body.role
        await client.query(insertStr, [username, password, role, phone, email]);
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.message = "Register successful"
        result.code = 200
        result.result = true
        res.write(JSON.stringify(result))
        res.end()
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Register failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .post('/edit', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM T_USER WHERE ID=$1'
      const user = await client.query(queryStr, [req.body.id]);
      console.log("user = " + user.rowCount)
      const exsit = (user.rowCount > 0) ? true : false
      if(exsit) {
        var updateStr = 'UPDATE T_USER SET PHONE = $1, EMAIL = $2 WHERE ID = $3'
        var queryStr = 'SELECT ID, USER_NAME, ROLE, PHONE, EMAIL FROM T_USER WHERE ID=$1'
        var id = req.body.id
        var phone = req.body.phone
        var email = req.body.email
        const edit = await client.query(updateStr, [phone, email, id]);
        console.log("edit = " + edit.rowCount)
        if(edit.rowCount > 0){
          const user = await client.query(queryStr, [id]);
          console.log("user = " + user.rows)
          res.writeHead(200, { 'Content-Type': 'text/html' })
          const result = new Object()
          result.userInfo = user.rows
          result.message = "User information edits successful"
          result.code = 200
          result.result = true
          res.write(JSON.stringify(result))
          res.end()
        }else {
          const result = new Object()
          result.code = 500
          result.message = "User information edits failed" 
          res.write(JSON.stringify(result));  
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end();
        }
      } else {
        const result = new Object()
        result.code = 401
        result.message = "User does not exist" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "User information edits failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .post('/address', async (req, res) => {
    try {
      const client = await pool.connect()
      console.log("address")
      var queryStr = 'SELECT A.ID, CITY, SUBURB, STREET, TYPE_ID, B.TYPE_NAME, STATUS, DEPARTURE_TIME, ARRIVED_TIME FROM T_ADDRESS AS A, T_A_TYPE AS B WHERE B.ID = A.TYPE_ID'
      const addresses = await client.query(queryStr);
      console.log("addresses = " + addresses.rowCount)
      const exsit = (addresses.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.addresses = addresses.rows
        result.message = ""
        result.code = 200
        res.write(JSON.stringify(result))
        res.end()
      }else {
        const result = new Object()
        result.code = 500
        result.message = "No Address" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get delivery addresses failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .get('/address/:itemid', async (req, res) => {
    try {
      const client = await pool.connect()
      console.log("/address/:itemid")
      var queryStr = 'SELECT A.ID, CITY, SUBURB, STREET, TYPE_ID, B.TYPE_NAME, STATUS, DEPARTURE_TIME, ARRIVED_TIME FROM T_ADDRESS AS A, T_A_TYPE AS B WHERE A.ID = $1 AND B.ID = A.TYPE_ID'
      const address = await client.query(queryStr, [req.params.itemid]);
      console.log("address = " + address.rowCount)
      const exsit = (address.rowCount > 0) ? true : false
      console.log("address = " + req.params.itemid)
      if(exsit) {
        console.log("1")
        const result = new Object()
        result.addresses = address.rows
        result.message = ""
        result.code = 200
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(JSON.stringify(result))
        res.end()
      }else {
        console.log("2")        
        const result = new Object()
        result.code = 500
        result.message = "No Address" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.log("3")        
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get delivery address failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .put('/address/departure', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM T_ADDRESS WHERE ID = $1'
      const departureAddress = await client.query(queryStr, [req.body.id]);
      console.log("departureAddress = " + departureAddress.rowCount)
      const exsit = (departureAddress.rowCount > 0) ? true : false
      if(exsit) {
        var updateStr = "UPDATE T_ADDRESS SET DEPARTURE_TIME = $1, STATUS = 1 WHERE ID = $2";
        const departure = await client.query(updateStr, [req.body.time, req.body.id])
        console.log("departure = " + departure.rowCount)
        const isSuccess = (departure.rowCount > 0) ? true : false
        if(isSuccess){
          console.log("1")
          var queryStr = 'SELECT A.ID, CITY, SUBURB, STREET, TYPE_ID, B.TYPE_NAME, STATUS, DEPARTURE_TIME, ARRIVED_TIME FROM T_ADDRESS AS A, T_A_TYPE AS B WHERE A.ID = $1 AND B.ID = A.TYPE_ID'
          const address = await client.query(queryStr, [req.body.id]);
          const result = new Object()
          result.addresses = address.rows
          result.message = ""
          result.code = 200
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.write(JSON.stringify(result))
          res.end()
        }else{
          console.log("2")
          console.error(err);
          const result = new Object()
          result.code = 500
          result.message = "Departure request failed" 
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(JSON.stringify(result));  
          res.end();
        }
      }else {
        console.log("3")
        const result = new Object()
        result.code = 500
        result.message = "No Address" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.log("4")
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Departure request failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .put('/address/arrived', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM T_ADDRESS WHERE ID = $1'
      const arrivedAddress = await client.query(queryStr, [req.body.id]);
      console.log("arrivedAddress = " + arrivedAddress.rowCount)
      const exsit = (arrivedAddress.rowCount > 0) ? true : false
      if(exsit) {
        var updateStr = "UPDATE T_ADDRESS SET ARRIVED_TIME = $1, STATUS = 2 WHERE ID = $2";
        const arrived = await client.query(updateStr, [req.body.time, req.body.id])
        console.log("arrived = " + arrived.rowCount)
        const isSuccess = (arrived.rowCount > 0) ? true : false
        if(isSuccess){
          var queryStr = 'SELECT A.ID, CITY, SUBURB, STREET, TYPE_ID, B.TYPE_NAME, STATUS, DEPARTURE_TIME, ARRIVED_TIME FROM T_ADDRESS AS A, T_A_TYPE AS B WHERE A.ID = $1 AND B.ID = A.TYPE_ID'
          const address = await client.query(queryStr, [req.body.id]);
          const result = new Object()
          result.addresses = address.rows
          result.message = ""
          result.code = 200
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.write(JSON.stringify(result))
          res.end()
        }else{
          console.error(err);
          const result = new Object()
          result.code = 500
          result.message = "Arrived request failed" 
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(JSON.stringify(result));  
          res.end();
        }
      }else {
        const result = new Object()
        result.code = 500
        result.message = "No Address" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Arrived request failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .post('/cleaning/user/:username', async (req, res) => {
    try {
      const client = await pool.connect()
      
      var decoded = new Buffer(req.headers.authorization, 'base64').toString('ascii')
      console.log("decoded = " + decoded)
      var splitedStrs = decoded.split(":")
      var password = ""
      if(splitedStrs.length > 1) {
        password = splitedStrs[1]
      }
      var queryStr = 'SELECT A.ID, USERNAME, CITY, SUBURB, STREET, PHONE, EMAIL, A.ROLE_ID, BALANCE, B.ROLE_NAME FROM CT_USER AS A, CT_USERROLE AS B WHERE USERNAME=$1 AND PASSWORD=$2 AND B.ID = A.ROLE_ID;'
      const user = await client.query(queryStr, [req.params.username, password]);
      console.log("user = " + user.rowCount)
      const exsit = (user.rowCount > 0) ? true : false
      if(exsit) {
        var productStr = 'SELECT CT_PRODUCT.ID, \
                                 CT_PRODUCT.ICON AS PRODUCT_ICON, \
                                 CT_SUB_TYPE.ICON AS ICON, \
                                 CT_PRODUCT.SUB_ID, \
                                 CT_SUB_TYPE.TYPE_NAME AS SUB_TYPE_NAME, \
                                 CT_PRODUCT.MAIN_ID, \
                                 CT_SUB_TYPE.BULK_DISCOUNT, \
                                 CT_MAIN_TYPE.TYPE_NAME AS MAIN_TYPE_NAME, \
                                 PRODUCT_NAME, UNIT_PRICE, UNIT \
                          FROM CT_PRODUCT, CT_SUB_TYPE, CT_MAIN_TYPE \
                          WHERE CT_PRODUCT.SUB_ID = CT_SUB_TYPE.ID \
                          AND CT_PRODUCT.MAIN_ID = CT_MAIN_TYPE.ID ORDER BY CT_PRODUCT.SUB_ID, CT_PRODUCT.ID'
        const products = await client.query(productStr);
        res.writeHead(200, { 'Content-Type': 'text/html' });   
        const result = new Object()
        result.userInfo = user.rows
        if(products.rowCount > 0){
          result.serviceTypes = products.rows
        }
        result.code = 200
        result.message = "Login successful" 
        res.write(JSON.stringify(result));  
        res.end();
      } else {
        const result = new Object()
        result.code = 401
        result.message = "User does not exist" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Login failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .post('/cleaning/user', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM CT_USER WHERE USERNAME=$1'
      const user = await client.query(queryStr, [req.body.userName]);
      console.log(JSON.stringify(user))
      const exsit = (user.rowCount > 0) ? true : false
      console.error("exsit="+exsit)
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        const result = new Object()
        result.code = 403
        result.message = "Username have exsited"
        result.result = false
        res.write(JSON.stringify(result))
        res.end()
      } else {
        var insertStr = 'INSERT INTO CT_USER(USERNAME, PASSWORD, PHONE, EMAIL, CITY, SUBURB, STREET, ROLE_ID, BALANCE) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
        var username = req.body.username
        var password = req.body.password
        var phone = req.body.phone
        var email = req.body.email
        var city = req.body.city
        var suburb = req.body.suburb
        var street = req.body.street
        var role_id = req.body.role_id
        var balance = req.body.balance
        await client.query(insertStr, [username, password, phone, email, city, suburb, street, role_id, balance]);
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.message = "Register successful"
        result.code = 200
        result.result = true
        res.write(JSON.stringify(result))
        res.end()
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Register failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .post('/cleaning/edit', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM CT_USER WHERE ID=$1'
      const user = await client.query(queryStr, [req.body.id]);
      console.log("user = " + user.rowCount)
      const exsit = (user.rowCount > 0) ? true : false
      if(exsit) {
        var updateStr = 'UPDATE CT_USER SET PHONE = $1, EMAIL = $2, CITY = $3, SUBURB = $4, STREET = $5 WHERE ID = $6'
        var queryStr = 'SELECT A.ID, USERNAME, CITY, SUBURB, STREET, PHONE, EMAIL, A.ROLE_ID, BALANCE, B.ROLE_NAME FROM CT_USER AS A, CT_USERROLE AS B WHERE A.ID=$1 AND B.ID = A.ROLE_ID;'
        var id = req.body.id
        var phone = req.body.phone
        var email = req.body.email
        var city = req.body.city
        var suburb = req.body.suburb
        var street = req.body.street
        const edit = await client.query(updateStr, [phone, email, city, suburb, street, id]);
        console.log("edit = " + edit.rowCount)
        if(edit.rowCount > 0){
          const user = await client.query(queryStr, [id]);
          console.log("user = " + user.rows)
          res.writeHead(200, { 'Content-Type': 'text/html' })
          const result = new Object()
          result.userInfo = user.rows
          result.message = "User information edits successful"
          result.code = 200
          result.result = true
          res.write(JSON.stringify(result))
          res.end()
        }else {
          const result = new Object()
          result.code = 500
          result.message = "User information edits failed" 
          res.write(JSON.stringify(result));  
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end();
        }
      } else {
        const result = new Object()
        result.code = 401
        result.message = "User does not exist" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "User information edits failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .get('/cleaning/service', async (req, res) => {
    try {

      const client = await pool.connect()
      var queryStr = 'SELECT CT_PRODUCT.ID, \
                              CT_PRODUCT.ICON AS PRODUCT_ICON, \
                              CT_SUB_TYPE.ICON AS ICON, \
                              CT_PRODUCT.SUB_ID, \
                              CT_SUB_TYPE.TYPE_NAME AS SUB_TYPE_NAME, \
                              CT_PRODUCT.MAIN_ID, \
                              CT_SUB_TYPE.BULK_DISCOUNT, \
                              CT_MAIN_TYPE.TYPE_NAME AS MAIN_TYPE_NAME, \
                              PRODUCT_NAME, UNIT_PRICE, UNIT \
                      FROM CT_PRODUCT, CT_SUB_TYPE, CT_MAIN_TYPE \
                      WHERE CT_PRODUCT.SUB_ID = CT_SUB_TYPE.ID \
                      AND CT_PRODUCT.MAIN_ID = CT_MAIN_TYPE.ID ORDER BY CT_PRODUCT.SUB_ID, CT_PRODUCT.ID'
      const results = await client.query(queryStr)
      console.log("results = " + results.rowCount)
      const exsit = (results.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.serviceTypes = results.rows
        result.message = "Get service type Successful"
        result.code = 200
        res.write(JSON.stringify(result))
        console.log("json = " + JSON.stringify(result))
        res.end()
      } else {
        const result = new Object()
        result.code = 401
        result.message = "None service type" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get service type failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .post('/cleaning/order/booking', async (req, res) => {
    try {

      const client = await pool.connect()
      var queryStr = 'INSERT INTO CT_ORDER (USER_ID, \
                                            SUB_ID, \
                                            DATE, \
                                            CITY, \
                                            SUBURB, \
                                            STREET, \
                                            STATUS,\
                                            AMOUNT, \
                                            QUANTITY, \
                                            RATING, \
                                            PHONE) \
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ID'
      const orderId = await client.query(queryStr, [req.body.order.user_id, 
                                                    req.body.order.subServiceType.id,
                                                    req.body.order.date,
                                                    req.body.order.city,
                                                    req.body.order.suburb,
                                                    req.body.order.street,
                                                    req.body.order.status,
                                                    req.body.order.amount,
                                                    req.body.order.quantity,
                                                    req.body.order.rating,
                                                    req.body.order.phone])
                                     
      console.log("orderId = " + orderId.rowCount)
      console.log("orderId = " + orderId.rows[0].id)
      const exsit = (orderId.rows[0].id > 0) ? true : false
      if(exsit) {
        var productStr = 'INSERT INTO CT_SUB_ORDER (ORDER_ID, \
                                                  PRODUCT_ID, \
                                                  QUANTITY)\
                          VALUES ($1, $2, $3);'
        const products = req.body.products
        console.log("products = " + req.body.products.length)
        if(products.length > 0){
          var number = 0
          for(i = 0; i < products.length; i++){
            var product = products[i]
            const results = await client.query(productStr, [orderId.rows[0].id, 
                                                            product.id,
                                                            product.quantity])
            console.log("results = " + results.rowCount)
            number += results.rowCount;                                       
          }
          console.log("number = " + number)
          if(number == products.length){
            res.writeHead(200, { 'Content-Type': 'text/html' })
            const result = new Object()
            result.result = true
            result.message = "Service booking Successful"
            result.code = 200
            res.write(JSON.stringify(result))
            res.end()
          }else{
            var deleteStr = 'DELETE FROM CT_ORDER WHERE ID = $1'
            await client.query(deleteStr, [orderId.rows[0].id])
            const result = new Object()
            result.code = 401
            result.message = "Service booking failed" 
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(JSON.stringify(result));  
            res.end();
          }
        }else{
          var deleteStr = 'DELETE FROM CT_ORDER WHERE ID = $1'
          await client.query(deleteStr, [orderId.rows[0].id])
          const result = new Object()
          result.code = 401
          result.message = "Service booking failed" 
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write(JSON.stringify(result));  
          res.end();
        }
      } else {
        const result = new Object()
        result.code = 401
        result.message = "Service booking failed" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Service booking failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .get('/cleaning/order/customer/:user_id', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT O.ID AS ID, \
                             O.USER_ID AS USER_ID, \
                             O.DATE AS DATE, \
                             S.TYPE_NAME AS SUB_TYPE_NAME, \
                             S.BULK_DISCOUNT AS BULK_DISCOUNT, \
                             SO.ID AS PRODUCT_ID, \
                             P.MAIN_ID AS MAIN_ID, \
                             O.SUB_ID AS SUB_ID, \
                             S.ICON AS SUB_ICON, \
                             P.PRODUCT_NAME AS PRODUCT_NAME, \
                             P.ICON AS PRODUCT_ICON, \
                             P.UNIT_PRICE AS UNIT_PRICE, \
                             P.UNIT AS UNIT, \
                             SO.QUANTITY AS PRODUCT_QUANTITY, \
                             O.PHONE AS PHONE, \
                             O.CITY AS CITY, \
                             O.SUBURB AS SUBURB, \
                             O.STREET AS STREET, \
                             O.STATUS AS STATUS, \
                             O.AMOUNT AS AMOUNT, \
                             O.DURATION AS DURATION, \
                             O.START_TIME AS START_TIME, \
                             O.END_TIME AS END_TIME, \
                             O.QUANTITY AS QUANTITY, \
                             O.FEEDBACK AS FEEDBACK, \
                             O.RATING AS RATING \
                       FROM CT_ORDER AS O, CT_SUB_TYPE AS S, CT_PRODUCT AS P, CT_SUB_ORDER AS SO \
                       WHERE SO.PRODUCT_ID = P.ID AND SO.ORDER_ID = O.ID AND O.SUB_ID = S.ID AND USER_ID = $1 \
                       ORDER BY O.ID'
      const orders = await client.query(queryStr, [req.params.user_id])
      console.log("orders = " + orders.rowCount)
      const exsit = (orders.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.orderResponses = orders.rows
        result.message = "Get orders type Successful"
        result.code = 200
        res.write(JSON.stringify(result))
        res.end()
      } else {
        const result = new Object()
        result.code = 401
        result.message = "None orders" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        console.log("result = " + JSON.stringify(result))
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get orders failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .get('/cleaning/order/staff', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT O.ID AS ID, \
                             O.USER_ID AS USER_ID, \
                             O.DATE AS DATE, \
                             S.TYPE_NAME AS SUB_TYPE_NAME, \
                             S.BULK_DISCOUNT AS BULK_DISCOUNT, \
                             SO.ID AS PRODUCT_ID, \
                             P.MAIN_ID AS MAIN_ID, \
                             O.SUB_ID AS SUB_ID, \
                             S.ICON AS SUB_ICON, \
                             P.PRODUCT_NAME AS PRODUCT_NAME, \
                             P.ICON AS PRODUCT_ICON, \
                             P.UNIT_PRICE AS UNIT_PRICE, \
                             P.UNIT AS UNIT, \
                             SO.QUANTITY AS PRODUCT_QUANTITY, \
                             O.PHONE AS PHONE, \
                             O.CITY AS CITY, \
                             O.SUBURB AS SUBURB, \
                             O.STREET AS STREET, \
                             O.STATUS AS STATUS, \
                             O.AMOUNT AS AMOUNT, \
                             O.DURATION AS DURATION, \
                             O.START_TIME AS START_TIME, \
                             O.END_TIME AS END_TIME, \
                             O.QUANTITY AS QUANTITY, \
                             O.FEEDBACK AS FEEDBACK, \
                             O.RATING AS RATING \
                       FROM CT_ORDER AS O, CT_SUB_TYPE AS S, CT_PRODUCT AS P, CT_SUB_ORDER AS SO \
                       WHERE SO.PRODUCT_ID = P.ID AND \
                             SO.ORDER_ID = O.ID AND \
                             O.SUB_ID = S.ID AND \
                             STATUS < 2 \
                             ORDER BY O.ID'

      const orders = await client.query(queryStr)
      console.log("results = " + orders.rowCount)
      const exsit = (orders.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.orderResponses = orders.rows
        result.message = "Get orders type Successful"
        result.code = 200
        res.write(JSON.stringify(result))
        res.end()
      } else {
        const result = new Object()
        result.code = 401
        result.message = "None orders" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get orders failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .put('/cleaning/order/started', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'UPDATE CT_ORDER SET START_TIME = $1, STATUS = $2 WHERE ID = $3'
      const started = await client.query(queryStr, [req.body.start_time, req.body.status, req.body.id])
      console.log('started =' + started.rowCount)
      const exsit = (started.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.message = "Service has started"
        result.code = 200
        result.result = true
        res.write(JSON.stringify(result))
        res.end()
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Service starts failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .put('/cleaning/order/finished', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'UPDATE CT_ORDER SET END_TIME = $1, STATUS = $2, AMOUNT = $3, DURATION = $4 WHERE ID = $5;'
      const finished = await client.query(queryStr, [req.body.end_time, req.body.status, req.body.amount, req.body.duration, req.body.id])
      console.log('finished =' + finished.rowCount)
      const exsit = (finished.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.message = "Service has finished"
        result.code = 200
        result.result = true
        res.write(JSON.stringify(result))
        res.end()
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Service finishes failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .get('/cleaning/payment/discount', async (req, res) => {
    try {
      const client = await pool.connect()
      var queryStr = 'SELECT * FROM CT_DISCOUNT ORDER BY ID DESC'
      const discounts = await client.query(queryStr)
      console.log("discounts = " + discounts.rowCount)
      const exsit = (discounts.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        result.discounts = discounts.rows
        result.message = ""
        result.code = 200
        res.write(JSON.stringify(result))
        res.end()
      } else {
        const result = new Object()
        result.code = 401
        result.message = "None discount" 
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(result));  
        res.end();
      }
    } catch (err) {
      console.error(err);
      const result = new Object()
      result.code = 500
      result.message = "Get discounts failed" 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(JSON.stringify(result));  
      res.end();
    }
  })
  .put('/cleaning/payment/balance', async (req, res) => {
    try {
      const client = await pool.connect()
      var updateBalance = 'UPDATE CT_USER SET BALANCE = $1 WHERE ID = $2'
      const userUpdate = await client.query(updateBalance, [req.body.balance, req.body.user_id])
      console.log('userUpdate =' + userUpdate.rowCount)
      const exsit = (userUpdate.rowCount > 0) ? true : false
      if(exsit) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        const result = new Object()
        var userStr = 'SELECT A.ID, USERNAME, CITY, SUBURB, STREET, PHONE, EMAIL, A.ROLE_ID, BALANCE, B.ROLE_NAME FROM CT_USER AS A, CT_USERROLE AS B WHERE A.ID = $1 AND B.ID = A.ROLE_ID';
        const user = await client.query(userStr, [req.body.user_id])
        if(req.body.isOrder){
          console.log('order =' + req.body.isOrder)
          var updateOrder = 'UPDATE CT_ORDER SET STATUS = $1, FEEDBACK = $2, RATING = $3 WHERE ID = $4'
          const order = await client.query(updateOrder, [req.body.status, req.body.feedback, req.body.rating, req.body.order_id])
          console.log('order =' + order.rowCount)
          if(order.rowCount > 0){
            result.message = "Payment is successful"
            result.code = 200
            result.type = 5
            result.userInfo = user.rows
            res.write(JSON.stringify(result))
            console.log('json =' + JSON.stringify(result))
            res.end()
          }else{
            result.message = "Payment is failed"
            result.code = 500
            res.end()
          }
        }else{
          console.log('order =' + req.body.isOrder)
          console.log('user.rows =' + user.rowCount)
          result.message = "Payment is successful"
          result.code = 200
          result.type = 6
          result.userInfo = user.rows
          res.write(JSON.stringify(result))
          console.log('json =' + JSON.stringify(result))
          res.end()
        }
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Payment is failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .put('/cleaning/payment/card', async (req, res) => {
    try {
      const client = await pool.connect()
      var updateOrder = 'UPDATE CT_ORDER SET STATUS = $1, FEEDBACK = $2, RATING = $3 WHERE ID = $4'
      const order = await client.query(updateOrder, [req.body.status, req.body.feedback, req.body.rating, req.body.order_id])
      console.log('order =' + order.rowCount)
      const exsit = (order.rowCount > 0) ? true : false
      if(exsit) {
        const result = new Object()
        res.writeHead(200, { 'Content-Type': 'text/html' })
        result.message = "Payment is successful"
        result.code = 200
        result.result = true
        res.write(JSON.stringify(result))
        res.end()
      }
    } catch (err) {
      console.error(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const result = new Object()
      result.message = "Payment is failed"
      result.result = false
      result.code = 500
      res.end()
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
