require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  ref,
  push,
  get,
  update,
  remove,
  query,
  orderByKey,
} = require("firebase/database");
const database = require("./firebaseConfig");

const app = express();
const port = process.env.PORT || 8080;
const STATUS_OK = 200;
const STATUS_NOT_FOUND = 404;
const STATUS_ERROR = 500;

// Middleware para parsear o corpo das requisições como JSON
app.use(express.json());

// Use o middleware CORS
app.use(cors());

// Rota para criar um recurso (exemplo de POST)
app.post("/todos", (req, res) => {
  const todos = req.body;

  // Referência ao nó onde os dados serão armazenados
  const dbRef = ref(database, "todos");

  // Inserir dados no nó
  push(dbRef, todos)
    .then(() => {
      res.status(STATUS_OK).send(`${JSON.stringify(todos)}`);
    })
    .catch((error) => {
      res.status(STATUS_ERROR).send("Erro ao inserir dados: " + error);
    });
});

// Rota para buscar todos os dados com paginação
app.get("/todos", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10
  const offset = parseInt(req.query.offset, 10) || 0; // Default offset to 0

  const dbRef = ref(database, "todos");

  const todosQuery = query(dbRef, orderByKey());

  get(todosQuery)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const todos = snapshot.val();
        const todosArray = Object.entries(todos).map(([key, value]) => ({
          key,
          ...value,
        }));
        todosArray.reverse();
        const parcialTodos = todosArray.slice(offset, offset + limit);
        res.status(STATUS_OK).json(parcialTodos);
      } else {
        res.status(STATUS_NOT_FOUND).send("Nenhum dado encontrado.");
      }
    })
    .catch((error) => {
      res.status(STATUS_ERROR).send("Erro ao buscar dados: " + error);
    });
});

app.get("/todos/count", async (req, res) => {
  const dbRef = ref(database, "todos");
  const todosQuery = query(dbRef);

  try {
    const snapshot = await get(todosQuery);
    if (snapshot.exists()) {
      const todos = snapshot.val();
      res.status(STATUS_OK).json({ count: Object.keys(todos).length });
    } else {
      res.status(STATUS_NOT_FOUND).send("Nenhum 'todo' encontrado.");
    }
  } catch (error) {
    res.status(STATUS_ERROR).send(`Erro ao buscar e contar 'todos': ${error}`);
  }
});

// Rota para atualizar um recurso específico (exemplo de PUT)
app.put("/todos/:id", (req, res) => {
  const id = req.params.id;
  const novosTodos = req.body;

  // Referência ao nó específico do dado a ser atualizado
  const dbRef = ref(database, `todos/${id}`);

  // Atualizar dados no nó
  update(dbRef, novosTodos)
    .then(() => {
      res.status(STATUS_OK).send(`${JSON.stringify(novosTodos)}`);
    })
    .catch((error) => {
      res.status(STATUS_ERROR).send("Erro ao atualizar dados: " + error);
    });
});

// Rota para remover um recurso específico (exemplo de DELETE)
app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;

  // Referência ao nó específico do dado a ser removido
  const dbRef = ref(database, `todos/${id}`);

  // Remover dados do nó
  remove(dbRef)
    .then(() => {
      res.status(STATUS_OK).send(`Dado removido com sucesso: ${id}`);
    })
    .catch((error) => {
      res.status(STATUS_ERROR).send("Erro ao remover dado: " + error);
    });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
