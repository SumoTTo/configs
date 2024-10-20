const glob = require( 'glob' );
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
		compiler.hooks.beforeRun.tap( 'SumoTToCleanWebpackPlugin', () => {
			this.del();
		} );

		compiler.hooks.watchRun.tap( 'SumoTToCleanWebpackPlugin', () => {
			if ( isRunning ) {
				return;
			}

			isRunning = true;

			this.del();
		} );
	}

	del() {
		glob.sync( this.patterns ).forEach( ( file ) => {
			rimraf.sync( file, { glob: false } );
		} );
	}
}

module.exports = CleanWebpackPlugin;
