const glob = require( 'glob' );
const rimraf = require( 'rimraf' );
const fs = require( 'fs' );

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
		const inclusionPatterns = this.patterns.filter(
			( pattern ) => ! pattern.startsWith( '!' )
		);
		const exclusionPatterns = this.patterns
			.filter( ( pattern ) => pattern.startsWith( '!' ) )
			.map( ( pattern ) => pattern.slice( 1 ) );

		let directories = [];
		let filesToDelete = [];
		inclusionPatterns.forEach( ( pattern ) => {
			const results = glob.sync( pattern, { withFileTypes: true } );
			results.forEach( ( result ) => {
				if ( result.isDirectory() ) {
					directories.push( result.fullpath() );
				} else {
					filesToDelete.push( result.fullpath() );
				}
			} );
		} );

		let excludedFiles = [];
		exclusionPatterns.forEach( ( pattern ) => {
			const files = glob.sync( pattern, { nodir: true } );
			excludedFiles = excludedFiles.concat( files );
		} );

		directories = excludedFiles.filter(
			( e, index ) => directories.indexOf( e ) === index
		);
		excludedFiles = excludedFiles.filter(
			( e, index ) => excludedFiles.indexOf( e ) === index
		);
		filesToDelete = filesToDelete
			.filter( ( e, index ) => filesToDelete.indexOf( e ) === index )
			.filter( ( file ) => ! excludedFiles.includes( file ) );

		filesToDelete.forEach( ( file ) => {
			rimraf.sync( file, { glob: false } );
		} );

		directories.forEach( ( directory ) => {
			if ( fs.readdirSync( directory ).length === 0 ) {
				fs.rmdirSync( directory );
			}
		} );
	}
}

module.exports = CleanWebpackPlugin;
