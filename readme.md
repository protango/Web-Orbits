# Web-Orbits #
Is a 3D, interactive N-body simulation that runs in web browsers.

## Quick Start ##
### Prerequisites ###
1.  Install Node.JS. You can verify your Node.JS version by running `node -v`.
1.  Install Python 2. You can verify your Python version by running `python --version`.
1. **Optional:** If you are running Windows and don't have Visual Studio installed, you will need to install windows-build-tools using `npm install -g --production windows-build-tools`
### Setup and start ###
1.  Clone the project and navigate into the base directory
1.  Run `npm install` to install dependencies
1.  Run `npm run build` to build the project
1.  Run `npm start` to launch node
1.  Open your browser to localhost:3000

### Development ###
Open another terminal instance and run `gulp watch`. This will watch the interface files for changes and recompile on the fly.

## Troubleshooting ##
If you encounter this error on Windows: `Error: Node Sass does not yet support your current environment: Windows 64-bit with Unsupported runtime` when performing the `npm run build` step, run the following command to rebuild node-sass: `npm rebuild node-sass`. Ensure you either have Visual Studio or windows-build-tools installed when doing this. 
