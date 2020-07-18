import * as express from 'express';
import * as compression from 'compression';


const app = express();
const port = process.env.PORT || 3000;

app.use(compression());
app.use("/", express.static('dist/public'));

app.listen(port, () => console.log(`App listening on port ${port}!`));