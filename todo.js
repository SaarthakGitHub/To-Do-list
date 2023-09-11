import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));
mongoose.connect("mongodb+srv://saarthak173:Test123@cluster0.fsiscpa.mongodb.net/todolistDB", {useNewUrlParser: true});
 const itemsSchema = new mongoose.Schema(
    {
        name: String
    });
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to todo List"
});
const item2 = new Item({
    name: "Hit the submit button to add a new item."
});
const item3 = new Item({
    name: "<--Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];


const ListSchema = {
    name : String,
    items: [itemsSchema]
}
const List = mongoose.model("List", ListSchema);


//Home page or default today page
app.get("/", async (req,res) => {
    try{
        let arr = await Item.find();                                    //As we have created an database collection of items so it will find the values.
        if(arr.length === 0){
            Item.insertMany(defaultItems);                              // If array length is 0 then it will save item1,2,3 -> we have created their array because of syntax of insertMany  (["",""])
            arr = await Item.find();                                    // Array will again fetch the values of collection(Item) which is now default values.
            res.redirect("/");                                          //So now the array length is not 0, it will trigger else while redirecting.
        } else {                                                        //if the value of array is not 0 this means data is already store in items(Which stores task of today), be it default items or new items
            arr = await Item.find();                                    //It will store the tasks to array and render webpage to show it on webpage.
            res.render("todo.ejs", {title: "Today", data: arr});
        }
    } catch(err){
        console.log(err);
    }
});

//If any other custom list request comes then it will be handled by this route.
app.get("/:customRoute", async (req,res) => {
    const customRoute = _.capitalize(req.params.customRoute);                              //Using this we will get to know which list request comes
    try{
    const found = await List.findOne({name : customRoute});             //It will find if the document of that name exists
    if(found){                                                          // If it is exist then it will render webpage and pass the data to it.
        res.render("todo.ejs", {title: found.name, data: found.items}); // found.name will be equal to customRoute.
    } else {                                                            // If it doesn't exist then it will create list having name of that list and pass default data because it does not contain anything.
        const list = new List({
            name: customRoute,
            items: defaultItems                                         // It is alreeady and array.
        });
        list.save();                                                    //It will save the list having default items as items
        res.redirect("/" + customRoute);                                //Now it will redirect to this route only and now the list of that particular name contains valye(i.e default values)
    }
    } catch(err){
        console.error(err);
    }
});

app.post("/submit",async (req,res) => {
    const itemName = req.body.text;                                     //It will store the text passed througth form.
    const list1 = req.body.list;                                        //This will contain value of <name = list value="?">, It is done so that we could understand which list user is talking about(Today, Work, Home)
    const item = new Item({
        name: itemName    
    });                                                                 //It will create a new item from schema to store in collections
    if(list1 == "Today"){                                               //If the list is Today then it will store in item collection and redirect to show value on webpage
        item.save();
        res.redirect("/");
    } else{                                                             //If the name of list is not today(default list) then it will trigger else statement.
        // try{                                                         //Post route is trigger when submit is clicked on form which means that the list already exists and contains default items or items submitted through form
        // const found = await List.findOne({name: list1});             // It will fetch the data of list having name list1. 
        // found.items.push(item);                                      // new item created based on itemName passed through form is added to previous data
                                                                        //The found document is retrieved from the "List" collection because you used the List model's findOne method to query the collection.
                                                                        //Mongoose determines the collection to use for the query based on the model you use in the query.
        // found.save();                                                //It will save the updated List, now the list is containing req.body.text also.
        // res.redirect("/" + list1);                                   //It will redirect it to "/:customRoute" route to display it in webpage
        // } catch(err) {
        //     console.log(err);
        // }

            /* ALTERNATE STEP*/ 

        try{
        await List.findOneAndUpdate(
            {name: list1},
            { $push : {items : item}}
        );
        res.redirect("/" + list1);
    } catch(err){
                console.error(err);
            }
    
    }
});

app.post("/delete", async (req,res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName == "Today"){
        await Item.deleteOne({_id: checkedItemId});
    res.redirect("/");
    } else{
        try{
        const found = await List.findOneAndUpdate({name : listName}, 
            {$pull : {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
        } catch(err){
            console.log(err);
        }
    };
});

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
});
