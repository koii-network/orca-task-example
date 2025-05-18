import express from "express";
import morgan from "morgan";
import { configureMorgan } from "./configure-morgan";
import { v4 as uuidv4 } from "uuid";
import { verifySignature } from "./utils/verifySignature";

export const app = express();
const port = process.env.PORT || 5000;

configureMorgan(morgan, app);

// Add body-parser middleware
app.use(express.json());


app.get("/", (_req: express.Request, res: express.Response) => {
    res.json({ status: 200, message: "Running" });
});

app.post("/fetch-todo", (req: express.Request, res: express.Response) => {

    const { signature, stakingKey } = req.body;

    console.log("RECEIVED FETCH TODO REQUEST BY ", stakingKey);

    // Verify the signature
    if (!signature) {
        console.log("SIGNATURE NOT FOUND");
        res.json({ status: 400, message: "signature not found" });
        return;
    }

    if (!stakingKey) {
        console.log("stakingKey NOT FOUND");
        res.status(400).json({ status: 400, message: " stakingKey not found" });
        return;
    }

    if (!verifySignature(signature, stakingKey)) {
        console.log("SIGNATURE VERIFICATION FAILED");
        res.status(400).json({ status: 400, message: "signature verification failed" });
        return;
    }

    // SOME LOGIC TO GET A todo from db or somewhere, sending dummy for now
    const uuid = uuidv4();
    const dummyTodo = {
        todoID: uuid,
        todo: "ComputeFibonacci",
        input: 10
    }
    res.json({ status: 200, data: dummyTodo });
})

app.post("/post-todo-result", (req: express.Request, res: express.Response) => {

    // Receive the response for the Todo and act upon it (The todo response will also be submitted to the task result)
    const { signature, stakingPubkey, result, cid } = req.body;
    // Verify the signature
    if (!signature) {
        console.log("SIGNATURE NOT FOUND");
        res.status(400).json({ status: 400, message: "signature not found" });
        return;
    }

    if (!stakingPubkey) {
        console.log("stakingPubkey NOT FOUND");
        res.status(400).json({ status: 400, message: " stakingPubkey not found" });
        return;
    }

    if (!verifySignature(signature, stakingPubkey)) {
        console.log("SIGNATURE VERIFICATION FAILED");
        res.status(400).json({ status: 400, message: "signature verification failed" });
        return;
    }

    console.log("\n\nRECEIVED Result: ", result);
    console.log("CID", cid);
    console.log("\n\n");
    res.json({ status: 200, message: "success" });
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("\x1b[31m%s\x1b[0m", "Error:", {
        timestamp: new Date().toISOString(),
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

app.listen(port, () => {
    console.log("\x1b[36m%s\x1b[0m", `Server running at http://localhost:${port}`);
})

