import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const App = () => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterAmount, setFilterAmount] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersResponse = await axios.get(
          "http://localhost:8000/customers"
        );
        const transactionsResponse = await axios.get(
          "http://localhost:8000/transactions"
        );
        setCustomers(customersResponse.data);
        setTransactions(transactionsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCustomerName = (customerId) => {
    const customer = customers.find((customer) => customer.id == customerId);
    return customer ? customer.name : "Unknown";
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const customerName = getCustomerName(transaction.customer_id);
    const matchesName =
      filterName === "" ||
      customerName.toLowerCase().includes(filterName.toLowerCase());
    const matchesAmount =
      filterAmount === "" ||
      transaction.amount.toString().includes(filterAmount);
    return matchesName && matchesAmount;
  });

  const customerTransactionsMap = filteredTransactions.reduce(
    (acc, transaction) => {
      const customerName = getCustomerName(transaction.customer_id);
      if (!acc[customerName]) {
        acc[customerName] = [];
      }
      acc[customerName].push(transaction);
      return acc;
    },
    {}
  );

  const customerTransactions = Object.keys(customerTransactionsMap).map(
    (customerName) => ({
      customerName,
      transactions: customerTransactionsMap[customerName],
    })
  );

  const customerTransactionsForChart = transactions.filter(
    (transaction) => transaction.customer_id === parseInt(selectedCustomerId)
  );

  const transactionDataByDate = customerTransactionsForChart.reduce(
    (acc, transaction) => {
      acc[transaction.date] = (acc[transaction.date] || 0) + transaction.amount;
      return acc;
    },
    {}
  );

  const chartData = {
    labels: Object.keys(transactionDataByDate),
    datasets: [
      {
        label: "Total Transaction Amount",
        data: Object.values(transactionDataByDate),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1,
      },
    ],
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Customer Transactions</h1>
      <div>
        <label>
          Filter by Customer Name:
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </label>
        <label>
          Filter by Transaction Amount:
          <input
            type="text"
            value={filterAmount}
            onChange={(e) => setFilterAmount(e.target.value)}
          />
        </label>
      </div>
      <div className="customer-cards">
        {customerTransactions.map(({ customerName, transactions }) => (
          <div className="customer-card" key={customerName}>
            <h3>{customerName}</h3>
            <ul>
              {transactions.map((transaction) => (
                <li key={transaction.id}>
                  <span>Date: {transaction.date}</span>
                  <span>Amount: {transaction.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>Total Transaction Amount per Day</h2>
      <label>
        Select Customer:
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      {selectedCustomerId && <Line data={chartData} />}
    </div>
  );
};

export default App;
