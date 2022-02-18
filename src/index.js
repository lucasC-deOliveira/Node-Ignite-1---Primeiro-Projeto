const { application } = require('express');
const express = require('express');
//importação da biblioteca
const { v4: uuidv4 } = require('uuid')
const app = express();

app.use(express.json())

//array para armazenar contas
const customers = [];


//Middleware para verificar se conta existe 
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    //buscando objeto por cpf
    const customer = customers.find(customer => customer.cpf === cpf);
    //verificando se customer existe
    if (!customer) {
        //retornando erro
        return response.status(400).json({ error: "Customer not found" });
    }
    //passando customer para requisição e então rota que chamou o middleware
    request.customer = customer;

    // voltando para a rota no caso de sucesso
    return next();
}


function getBalance(statement) {
    //reduce soma uma coleção de valores em um array 
    //acumulador é a variavel auxiliar de soma
    // reduce(acumulador, função, valor inicial do acumulador)

  const balance =  statement.reduce((acc, operation) => {
        //logica de soma
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }
        else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

//rota de criação de conta
app.post("/account", (request, response) => {
    //recuperando dados do body
    const { cpf, name } = request.body;

    //verificando se usuario ja existe a partir do cpf
    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customersAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists" });
    }



    //criando e armazenando objetos
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    //devolvendo resposta com codigo de sucesso
    return response.status(201).send();
});


//rota de estatement
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    //recuperando customer
    const { customer } = request;


    //retornando statement
    return response.json(customer.statement);
})

//rota de deposito
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    //recupenado dados da requisição
    const { description, amount } = request.body;
    //recuperando customer do middleware(request)
    const { customer } = request;

    //criando objeto deposito
    const statementOperation = {
        description,
        amount,
        create_at: new Date(),
        type: "credit"
    }
    //persistindo o deposito
    customer.statement.push(statementOperation);

    //retornando resposta
    return response.status(201).send();
})

//rota de saque
 //midleware para ver se conta existe 
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  

   //recuperando valor da requisição
    const { amount} = request.body;
    //recuperando customer validado
    const {customer} = request;

    //função para retornar saldo
    const balance = getBalance(customer.statement)

    //validação de saldo
    if(balance < amount) {
        return response.status(400).json({ 
            error: "Insufficient funds"
        })
    }

    //criar objeto de saque
    const statementOperation = {
        amount,
        create_at: new Date(),
        type: "debit"
    }

    //persistindo saque
    customer.statement.push(statementOperation)

    //retornando resposta
    return response.status(201).send();

})


//rota de estatement po data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    //recuperando customer
    const { customer } = request;

    //recuperando data 
    const { date } = request.query;

    //formatando data
    const dateFormat = new Date(date + " 00:00")

    //filtrando statement por data
    const statement = customer.statement.filter((statement) => statement.create_at.toDateString() === new Date(dateFormat).toDateString())

    //retornando statement
    return response.json(statement);
})

//rota de alteração de dados na conta
app.put("/account",verifyIfExistsAccountCPF, (request, response) => {
    //recuperando novo nome
    const { name } = request.body;
    //recuperando usuario autenticado
    const {customer} = request;

    //alterando nome
    customer.name = name

    //retornado sucesso
    return response.status(201).send()

})

//rota para retornar dados da conta
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
   //recuperando usuario autenticado
    const {customer} = request;
    //retornando dados da conta
    return response.json(customer);
})

//rota de deleção da conta
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    //recuperando usuario autenticado
    const {customer} = request;

    //remoção
    customers.splice(customer, 1);

    //retornando costumers restantes
    return response.status(200).json(customers);
})

//rota para retornar saldo
app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    //recuperando usuario autenticado
    const {customer} = request;

    //recuperando saldo
    const balance = getBalance(customer.statement);

    return response.json(balance);

})

app.listen(3333);