// generateData.js
const fs = require("fs");

const firstNames = ["Raj", "Amit", "Neha", "Priya", "Karan", "Simran", "Anil"];
const lastNames = ["Solanki", "Sharma", "Mehta", "Verma", "Kapoor", "Rao", "Gupta"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const data = [];

for (let i = 1; i <= 50000; i++) {
    const record = {
        id: i,
        firstName: getRandom(firstNames),
        lastName: getRandom(lastNames),
        Age: Math.floor(Math.random() * 30) + 20, // Age between 20-50
        Salary: Math.floor(Math.random() * 900000) + 100000 // Salary between 1L - 10L
    };
    data.push(record);
}

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
console.log("Data written to data.json");
