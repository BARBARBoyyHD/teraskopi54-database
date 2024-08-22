const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const e = require("express");

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
app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM product WHERE product_id = ?";

  pool
    .query(sql, [id])
    .then(([rows]) => {
      if (rows.length === 0) {
        res.status(404).json("item not found");
      } else {
        res.status(200).json(rows[0]);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// get all products
app.get("/api/products", (req, res) => {
  const sql = "SELECT * FROM product";

  pool
    .query(sql)
    .then(([rows]) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      res.status(500).json("ERROR FETCHING DATA");
    });
});

// delete product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM product WHERE product_id = ?";

  pool
    .query(sql, [id])
    .then(([results]) => {
      if (results.affectedRows > 0) {
        res.status(200).json({ message: "Item deleted successfully" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// edit product
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    product_category,
    hot_price,
    cold_price,
    large_size_price,
    small_size_price,
  } = req.body;

  // Check if an image is uploaded
  const image_url = req.file ? req.file.filename : null;

  // SQL query to update product with or without a new image
  let sql;
  let params;

  if (image_url) {
    // If a new image is uploaded, update the image URL
    sql = `UPDATE product SET product_name = ?, product_category = ?, hot_price = ?, cold_price = ?, large_size_price = ?, small_size_price = ?, image_url = ? WHERE product_id = ?`;
    params = [
      product_name,
      product_category,
      hot_price,
      cold_price,
      large_size_price,
      small_size_price,
      image_url,
      id,
    ];
  } else {
    // If no new image is uploaded, don't update the image URL
    sql = `UPDATE product SET product_name = ?, product_category = ?, hot_price = ?, cold_price = ?, large_size_price = ?, small_size_price = ? WHERE product_id = ?`;
    params = [
      product_name,
      product_category,
      hot_price,
      cold_price,
      large_size_price,
      small_size_price,
      id,
    ];
  }

  pool
    .query(sql, params)
    .then(([results]) => {  
      if (results.affectedRows > 0) {
        res.status(200).json({ message: "Item updated successfully" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "An error occurred" });
    });
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
  } = req.body;

  // Check if image was uploaded
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

  pool
    .query(sql, [
      product_name,
      product_category,
      hot_price,
      cold_price,
      large_size_price,
      small_size_price,
      image_url,
    ])
    .then(([rows]) => {
      res.status(200).json({ message: "Item was added successfully" });
    })
    .catch((err) => {
      console.error(err); // Log the error for debugging
      res.status(500).json({ message: "Failed to add item" });
    });
});

// edit cafe branch
app.put("/api/cafe-branch/:id", async (req, res) => {
  const { id } = req.params;
  const { branch_name, address_branch, contact } = req.body;

  const sql =
    "UPDATE cafe_branch SET branch_name = ?, address_branch = ?, contact = ? WHERE id_branch = ?";
  pool
    .query(sql, [branch_name, address_branch, contact, id])
    .then(([result]) => {
      if (result.affectedRows) {
        res.status(200).json("ITEM EDITED");
      } else {
        res.status(404).json("item not found");
      }
    })
    .catch((err) => {
      res.status(500).json("ERROR EDITING DATA");
    });
});

// delete cafe branch
app.delete("/api/cafe-branch/:id", async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM cafe_branch where id_branch = ?";

  pool
    .query(sql, [id])
    .then(([rows]) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
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

  pool
    .query(sql)
    .then(([rows]) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
