import * as express from 'express';

const app = express();
const port = process.env.PORT || 80;

app.use("/", express.static('dist/public'));
app.use("/inc/babylonjs", express.static('./node_modules/babylonjs'));

app.listen(port, () => console.log(`App listening on port ${port}!`));