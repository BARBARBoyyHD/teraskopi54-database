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

app.post("/upload-images", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const image_path = req.file.filename;
    const query = "INSERT INTO image (image_path) VALUES (?)"; // Insert the image path into the database

    pool.query(query, [image_path], (error, results) => {
      if (error) {
        console.error(error.message);
        return res.status(500).json({ error: "Server error" });
      }

      // Send back the inserted data as a response
      res.json({
        message: "Image uploaded successfully!",
        image: {
          id: results.insertId, // MySQL provides insertId for the newly inserted row
          image_path: image_path,
        },
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

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

    pool.query(query, [username, password_hash, contact], (error, results) => {
      if (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Send back the inserted data as a response
      res.status(201).json({
        id: results.insertId, // MySQL provides insertId for the newly inserted row
        username,
        contact,
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
});

// get all user cashier
app.get("/api/user-cashier", (req, res) => {
  pool.query("SELECT * FROM user_cashier", (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    // Send the results directly
    res.status(200).json(results);
  });
});

// User login endpoint
app.post("/api/login-cashier", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const query = "SELECT * FROM user_cashier WHERE username = ?";
    pool.query(query, [username], async (error, results) => {
      if (error) {
        console.error(error.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid username or password" });
      }

      const userData = results[0];
      const validPassword = await bcrypt.compare(
        password,
        userData.password_hash
      );

      if (!validPassword) {
        return res
          .status(400)
          .json({ message: "Invalid username or password" });
      }

      // If the password is valid, send a success response
      return res.status(200).json({ message: "Login successful" });
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
});

// user stock section
app.post("/api/register-stock", async (req, res) => {
  try {
    const { username, password, contact } = req.body;

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO user_stock (username, password_hash, contact) VALUES (?, ?, ?) RETURNING *",
      [username, password_hash, contact]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// get all user stock
app.get("/api/user-stock", async (req, res) => {
  try {
    const getUserCashier = await pool.query("SELECT * FROM user_stock");
    res.json(getUserCashier.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// login stock
app.post("/api/login-stock", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await pool.query(
      "SELECT * FROM user_stock WHERE username = ?",
      [username]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const userData = user.rows[0];
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
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

// inventory section
// get single inventory item
app.get("/api/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleItem = await pool.query(
      "SELECT * FROM inventory WHERE item_id = ?",
      [id]
    );
    res.json(getSingleItem.rows[0]);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// get all inventory items
app.get("/api/inventory", (req, res) => {
  // Execute the query to get all items from the inventory
  pool.query("SELECT * FROM inventory", (error, results) => {
    if (error) {
      console.error("Error fetching inventory items:", error); // Log detailed error to the console
      return res.status(500).json({
        message: "Failed to fetch inventory items",
        error: error.message || error,
      });
    }

    // Send the results as JSON response
    res.status(200).json(results); // `results` contains the rows of data
  });
});

// delete item inventory
app.delete("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  pool.query(
    "DELETE FROM inventory WHERE item_id = ?",
    [id],
    (error, result) => {
      if (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
      } else {
        res.status(200).json("item was deleted successfully");
      }
    }
  );
});

// edit inventory
app.put("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, price_per_pcs } = req.body;

  // SQL query with SET clause
  pool.query(
    "UPDATE inventory SET item_name = ?, quantity = ?, price_per_pcs = ? WHERE item_id = ?",
    [item_name, quantity, price_per_pcs, id],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      } else if (result.affectedRows === 0) {
        // If no rows were affected, the ID may not exist
        res.status(404).json({ message: "Item not found" });
      } else {
        res.status(200).json({ message: "Item updated successfully" });
      }
    }
  );
});

// add item inventory
app.post("/api/add-item", (req, res) => {
  const { item_name, quantity, price_per_pcs } = req.body;

  // Insert item into the database using the MySQL pool directly
  pool.query(
    "INSERT INTO inventory (item_name, quantity, price_per_pcs) VALUES (?, ?, ?)",
    [item_name, quantity, price_per_pcs],
    (error, result) => {
      if (error) {
        console.error("Error inserting item:", error); // Log detailed error to the console
        return res.status(500).json({
          message: "Failed to add item",
          error: error.message || error,
        });
      }

      // Retrieve the last inserted item
      pool.query(
        "SELECT * FROM inventory WHERE item_id = ?",
        [result.insertId],
        (error, rows) => {
          if (error) {
            console.error("Error fetching item:", error); // Log detailed error to the console
            return res.status(500).json({
              message: "Failed to fetch item",
              error: error.message || error,
            });
          }

          res.status(200).json(rows[0]); // Return the inserted item
        }
      );
    }
  );
});
// prodcut section

// get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleProduct = await pool.query(
      "SELECT * FROM product WHERE product_id = ?",
      [id]
    );
    res.json(getSingleProduct.rows[0]);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

// get all products
app.get("/api/products", async (req, res) => {
  try {
    const getAllproducts = await pool.query("SELECT * FROM product");
    res.json(getAllproducts.rows);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteProduct = await pool.query(
      "DELETE FROM product WHERE product_id = ?",
      [id]
    );
    res.status(200).json("Product Deleted");
  } catch (error) {
    res.json({ message: error });
  }
});
// edit product
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      product_name,
      product_category,
      quantity,
      product_price,
      image_url,
    } = req.body; // assuming you're updating these fields
    const editProduct = await pool.query(
      "UPDATE product SET product_name = ?, product_category = ?, quantity = ?, product_price = ? , image_url = $5 WHERE product_id = $6 RETURNING *",
      [product_name, product_category, quantity, product_price, image_url, id]
    );
    res.status(200).json(editProduct.rows[0]);
    if (editProduct.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json("item was updated successfully");
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// add product
// Add product with image
app.post("/api/add-product", upload.single("image"), async (req, res) => {
  try {
    const { product_name, product_category, quantity, product_price } =
      req.body;

    // Get the file path for the uploaded image
    const image_url = req.file.filename;

    // Insert product data into the database
    const new_product = await pool.query(
      "INSERT INTO product(product_name, product_category, quantity, product_price, image_url) VALUES(?, ?, ?, ?, $5) RETURNING *",
      [product_name, product_category, quantity, product_price, image_url]
    );

    res.status(200).json(new_product.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// edit cafe branch
app.put("/api/cafe-branch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, address_branch, contact } = req.body;
    const editBranch = await pool.query(
      "UPDATE cafe_branch SET branch_name = ?, address_branch = ?, contact = ? WHERE id_branch = ? RETURNING *",
      [branch_name, address_branch, contact, id]
    );
    if (editBranch.rowCount === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200);
    res.json("branch updated");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// delete cafe branch
app.delete("/api/cafe-branch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteBranch = await pool.query(
      "DELETE FROM cafe_branch WHERE id_branch = ?",
      [id]
    );
    res.status(200).json("Branch Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// add cafe branch
app.post("/api/add-cafe-branch", async (req, res) => {
  try {
    const { branch_name, address_branch, contact } = req.body;
    const new_branch = await pool.query(
      "INSERT INTO cafe_branch(branch_name, address_branch, contact) VALUES(?, ?, ?) RETURNING *",
      [branch_name, address_branch, contact]
    );
    res.status(200).json(new_branch.rows[0]); // Set the status before sending the JSON response
    res.json("data added successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message }); // Set a 500 status code on error
  }
});
// orders section

// Get all orders with their items
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders");

    // Organize results by order
    const orders = {};
    result.rows.forEach((row) => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          customer_name: row.customer_name,
          order_date: row.order_date,
          payment_method: row.payment_method,
          items: [],
        };
      }
      orders[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_order: row.quantity_order,
        price_total: row.price_total,
      });
    });

    res.json(Object.values(orders));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Add a new order with multiple items
app.post("/api/add-order", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { customer_name, payment_method, items } = req.body;

    // Insert each item into the orders table
    for (const item of items) {
      const { product_id, product_name, quantity_order, price_total } = item;

      await client.query(
        "INSERT INTO orders(customer_name, order_date, payment_method, product_id, product_name, quantity_order, price_total) VALUES(?, CURRENT_TIMESTAMP, ?, ?, ?, $5, $6)",
        [
          customer_name,
          payment_method,
          product_id,
          product_name,
          quantity_order,
          price_total,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order and items added successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
