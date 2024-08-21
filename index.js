const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// Define storage for the images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ); // Append timestamp to avoid filename collisions
  },
});

const upload = multer({ storage: storage });

const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// Remove this line: app.use(multer);

// login cashier section
// User registration endpoint cashier
app.post("/api/register-cashier", async (req, res) => {
  try {
    const { username, password, contact } = req.body;

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const query =
      "INSERT INTO user_cashier (username, password_hash, contact) VALUES (?, ?, ?)";

    // Use promise-based query
    const [results] = await pool.query(query, [
      username,
      password_hash,
      contact,
    ]);

    // Send back the inserted data as a response
    res.status(201).json({
      id: results.insertId, // MySQL provides insertId for the newly inserted row
      username,
      contact,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// get all user cashier
app.get("/api/user-cashier", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM user_cashier");

    // Send the results directly
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// User login endpoint
app.post("/api/login-cashier", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const [results] = await pool.query(
      "SELECT * FROM user_cashier WHERE username = ?",
      [username]
    );

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const userData = results[0];
    const validPassword = await bcrypt.compare(
      password,
      userData.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // If the password is valid, send a success response
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// user stock section
app.post("/api/register-stock", async (req, res) => {
  try {
    const { username, password, contact } = req.body;

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the MySQL database
    const sql =
      "INSERT INTO user_stock (username, password_hash, contact) VALUES (?, ?, ?)";

    // Use promise-based query
    const [results] = await pool.query(sql, [username, password_hash, contact]);

    // Send back the inserted data as a response
    res.status(201).json({ id: results.insertId, username, contact });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// get all user stock
app.get("/api/user-stock", async (req, res) => {
  try {
    const sql = "SELECT * FROM user_stock";

    pool.query(sql, (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
      }

      // 'results' contains the rows returned by the query in MySQL
      res.json(results);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// login stock
app.post("/api/login-stock", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username in MySQL
    const sql = "SELECT * FROM user_stock WHERE username = ?";

    // Use promise-based query
    const [results] = await pool.query(sql, [username]);

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const userData = results[0];
    const validPassword = await bcrypt.compare(
      password,
      userData.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // If the password is valid, send a success response
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
});

// inventory section
// get single inventory item
app.get("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM inventory WHERE item_id = ?";

  pool
    .query(sql, [id])
    .then(([results]) => {
      if (results.length === 0) {
        res.status(404).json({ message: "Item not found" });
      } else {
        res.status(200).json(results[0]);
      }
    })
    .catch((err) => {
      console.error("Error fetching item:", err);
      res.status(500).json({ message: "Error fetching item" });
    });
});

// get all inventory items
app.get("/api/inventory", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM inventory");
    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ message: "Error fetching inventory" });
  }
});
// delete item inventory
app.delete("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const deleteItem = "DELETE FROM inventory WHERE item_id = ?";

  pool
    .query(deleteItem, [id])
    .then(([results]) => {
      // MySQL2 returns results in an array
      if (results.affectedRows > 0) {
        console.log("Item Deleted Successfully");
        res.status(200).json({ message: "Item deleted successfully" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    })
    .catch((err) => {
      console.error("Error deleting item:", err);
      res.status(500).json({ message: "Failed to delete item" });
    });
});

// edit inventory
app.put("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, price_per_pcs } = req.body;

  const editItemQuery =
    "UPDATE inventory SET item_name = ?, quantity = ?, price_per_pcs = ? WHERE item_id = ?";

  try {
    const [result] = await pool.query(editItemQuery, [
      item_name,
      quantity,
      price_per_pcs,
      id,
    ]);

    if (result.affectedRows > 0) {
      console.log("Item edited successfully");
      res.status(200).json({ message: "Item updated successfully" });
    } else {
      console.log("Item not found");
      res.status(404).json({ message: "Item not found" });
    }
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Error updating item" });
  }
});

// add item inventory
app.post("/api/add-item", async (req, res) => {
  const { item_name, quantity, price_per_pcs } = req.body;
  const addItemQuery =
    "INSERT INTO inventory (item_name, quantity, price_per_pcs) VALUES (?, ?, ?)";

  try {
    const [result] = await pool.query(addItemQuery, [
      item_name,
      quantity,
      price_per_pcs,
    ]);
    console.log("Item added", result);
    res.status(200).json({ message: "Item added successfully" });
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ message: "Error adding item" });
  }
});
// prodcut section

// get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await db.execute(
      "SELECT * FROM product WHERE product_id = ?",
      [id]
    );

    // If no product is found
    if (results.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Return the first row (single product) in the results
    res.status(200).json(results[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// get all products
app.get("/api/products",  (req, res) => {
  const sql = "SELECT * FROM product";

  pool.query(sql)
  .then(([rows])=>{
    res.status(200).json(rows);
  })
  .catch((err)=>{
    res.status(500).json("ERROR FETCHING DATA")
  })

});

// delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM product WHERE product_id = ?";

    // Use async/await and promise-based pool.query
    const [results] = await pool.query(sql, [id]);

    // Check if any rows were affected (i.e., if a product was deleted)
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// edit product
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, product_category, product_price } = req.body;

    // Get the file path for the uploaded image, if provided
    const image_url = req.file ? req.file.filename : req.body.image_url; // Use the new image if uploaded, otherwise use the existing image URL

    const sql = `
      UPDATE product 
      SET product_name = ?, product_category = ?, product_price = ?, image_url = ?
      WHERE product_id = ?
    `;

    // Use promise-based query
    const [results] = await pool.query(sql, [
      product_name,
      product_category,
      product_price,
      image_url,
      id,
    ]);

    // Check if any rows were affected (i.e., if a product was updated)
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item was updated successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// add product
// Add product with image
app.post("/api/add-product", upload.single("image"), (req, res) => {
  const {
    product_name,
    product_category,
    hot_price,
    cold_price,
    large_size_price,
    small_size_price,
    variant_type, // This is not needed for this insertion but you can use it for validation
    size_name, // This is not needed for this insertion but you can use it for validation
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const image_url = req.file.filename;

  const sql = `
    INSERT INTO product (
      product_name, 
      product_category, 
      hot_price, 
      cold_price, 
      large_size_price, 
      small_size_price, 
      image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    sql,
    [
      product_name,
      product_category,
      hot_price,
      cold_price,
      large_size_price,
      small_size_price,
      image_url,
    ],
    (error, results) => {
      if (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json({ message: "Product added successfully" });
    }
  );
});

// edit cafe branch
app.put("/api/cafe-branch/:id", async (req, res) => {
  const {id} = req.params
  const {branch_name, address_branch, contact} = req.body

  const sql = "UPDATE cafe_branch SET branch_name = ?, address_branch = ?, contact = ? WHERE id_branch = ?";
  pool.query(sql,[branch_name, address_branch, contact, id])
  .then(([result])=>{
    if(result.affectedRows){
      res.status(200).json("ITEM EDITED")
    }
    else{
      res.status(404).json("item not found")
    }
    
    
  })
  .catch((err)=>{
    res.status(500).json("ERROR EDITING DATA")
  })

});

// delete cafe branch
app.delete("/api/cafe-branch/:id", async (req, res) => {
  const {id} = req.params
  const sql = "DELETE FROM cafe_branch where id_branch = ?";

  pool.query(sql,[id])
  .then(([rows])=>{
    res.status(200).json(rows);
  })
  .catch((err)=>{
    res.status(500).json({message:err.message});
  })

});

// add cafe branch
app.post("/api/add-cafe-branch", (req, res) => {
  const { branch_name, address_branch, contact } = req.body;
  const sql =
    "INSERT INTO cafe_branch(branch_name,address_branch,contact) VALUES(?,?,?)";

  pool
    .query(sql, [branch_name, address_branch, contact])
    .then(([rows]) => {
      res.status(200).json(rows);
      console.log("item Added Successfully");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while fetching data");
    });
});

// get all cafe branch
app.get("/api/cafe-branch", (req, res) => {
  const sql = "SELECT * FROM cafe_branch";

  pool
    .query(sql)
    .then(([rows]) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("An error occurred while fetching data");
    });
});
// get sinlge cafe branch
app.get("/api/cafe-branch/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM cafe_branch WHERE id_branch = ?";

  pool
    .query(sql, [id])
    .then(([rows]) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      console.error(err); // Logging the error for debugging
      res.status(500).send("An error occurred while fetching data");
    });
});

// orders section

// Get all orders with their items
app.post("/api/add-order", async (req, res) => {
  const { orders, total_amount } = req.body;

  if (!orders || orders.length === 0) {
    return res.status(400).json({ message: "No items in the cart" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert each order item
    const insertPromises = orders.map((order) =>
      connection.query(
        `INSERT INTO orders (customer_name, payment_method, product_id, product_name, variant_type, size_name, quantity_order, price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.customer_name,
          order.payment_method,
          order.product_id,
          order.product_name,
          order.variant_type,
          order.size_name,
          order.quantity_order,
          order.price,
          order.total_price,
        ]
      )
    );

    await Promise.all(insertPromises);

    await connection.commit();
    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Error placing order" });
  } finally {
    connection.release(); // Ensure the connection is released
  }
});

// get all orders
app.get("/api/orders", async (req, res) => {
  const sql = "SELECT * FROM orders";

  pool.query(sql)
  .then(([rows])=>{
    res.status(200).json(rows);
  })
  .catch((err)=>{
    res.status(500).json({message:err.message});
  })

})



app.listen(port, () => {
  console.log("http://localhost:" + port);
});
