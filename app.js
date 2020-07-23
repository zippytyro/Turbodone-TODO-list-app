// jshint esversion: 6

// requiring packages
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
day = date.getDate();
const app = express();
// using body-parser to get data from user input
app.use(bodyParser.urlencoded({
    extended: true
}));
// =============== GLobal variables =============
let newListURL;
// ==================================
// to serve static/media files.
app.use(express.static("public"));
mongoose.set('useFindAndModify', false);

// connecting to mongoose 
mongoose.connect("mongodb+srv://shashwat-admin:shashwat8429@cluster0.jgdc3.mongodb.net/todolistappDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

const itemsSchema = {
    name: String
};
const listSchema = {
    name: String,
    items: [itemsSchema]
};
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const defaultlist = new Item({
    name: "Get things done!"
});

const defaultItems = [defaultlist];

// engine: EJS
app.set('view engine', 'ejs');

app.get("/", function (req, res) {
    Item.find({}, function (err, results) {

        if (results.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (!err) {
                    console.log("Default items inserted.");
                }
            });
            res.redirect("/");
        } else {
            /* this will render file under /views folder with name list.ejs. 
            Data in the object is sent to the EJS file to display dynamically.*/
            res.render('list', {
                listTitle: day,
                newListItems: results
            });
        }
    });
});


// post request for home route.
app.post("/", function (req, res) {
    // what user entered
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        // saving the item
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/list/" + listName);
        });
    }
});

// Delete route for deleting the checked item
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    // checking if list is equal to default list or not.
    if (listName == day) {
        Item.findByIdAndDelete(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundList) {
            if (!err) {
                res.redirect("/list/" + listName);
            }
        });
    }
});

// post route for list change
app.post("/listChange", function (req, res) {
    newListURL = req.body.newlist;
    res.redirect("/list/" + newListURL);

    app.get("/list/:customListName", function (req, res) {
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({
            name: customListName
        }, function (err, results) {
            if (results) {
                // showing existing list
                res.render("list", {
                    listTitle: results.name,
                    newListItems: results.items
                });
            } else {
                // creating a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                // then saving the list
                list.save();
                // after that redirecting it to the custom route
                res.redirect("/list/" + customListName);
            }
        });
    });
});
// new list creation page.
app.get("/new-list", function (req, res) {
    res.render("newlist", {
        title: "Create Custom List"
    });
});
// about route
app.get("/company/about", function (req, res) {
    res.render("about", {
        listTitle: "About"
    });
});

// listening on PORT 3000
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started successfully!");
});
/* NOTES:
  (<%= %>) is EJS markup <% scriptlet tag can also be used for basic control-flow only in HTML, but use it sparsely. 
    <% if(kindOfDay === "Thursday" || kindOfDay === "Saturday" ){ %>
    <h1 style="color: purple">It's <%= kindOfDay %> ! </h1>
    <% } else { %>
    <h1 style="color: blue">It's <%= kindOfDay %> ! </h1>
    <% } %> 
*/