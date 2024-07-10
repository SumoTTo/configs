const { globbySync } = require( 'globby' );
const rimraf = require( 'rimraf' );

let isRunning = false;

class CleanWebpackPlugin {
	constructor( options ) {
		this.patterns = options.patterns.map( ( pattern ) =>
			pattern.replace( /\\/g, '/' )
		);
	}

	// noinspection JSUnusedGlobalSymbols
	apply( compiler ) {
		compiler.hooks.beforeRun.tap( 'SumoTToCleanWebpackPlugin', async () => {
			this.del();
		} );

		compiler.hooks.watchRun.tap( 'SumoTToCleanWebpackPlugin', async () => {
			if ( isRunning ) {
				return;
			}

			isRunning = true;

			this.del();
		} );
	}

	del() {
		globbySync( this.patterns ).forEach( ( file ) => {
			rimraf.sync( file, { glob: false } );
		} );
	}
}

module.exports = CleanWebpackPlugin;
