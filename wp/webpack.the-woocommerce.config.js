const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const CleanWebpackPlugin = require( '../helpers/clean-webpack-plugin' );
const SyncWebpackPlugin = require( '../helpers/sync-webpack-plugin' );
const { resolve } = require( 'node:path' );
const { Config, modulesConfigWP } = require( '../helpers/webpack' );
const rootPath = process.cwd().replace( /\\/g, '/' );
const outputPath = process.env.WP_CONTENT_DIR
	? resolve( process.env.WP_CONTENT_DIR, 'plugins/the-woocommerce' )
	: rootPath;

const modulesConfig = new Config( modulesConfigWP, 'modules' )
	.resetEntries()
	.addEntries( 'src/scripts/modules/*.{j,t}s' )
	.addPlugin(
		new CleanWebpackPlugin( {
			patterns: [ resolve( outputPath, '/build/scripts/modules/**/*' ) ],
		} )
	)
	.replacePlugin(
		new DependencyExtractionWebpackPlugin( {
			requestToExternalModule( request ) {
				if (
					typeof request === 'string' &&
					/^@the-woocommerce\//.test( request )
				) {
					return `import ${ request }`;
				}
			},
		} )
	);

if ( process.env.WP_CONTENT_DIR ) {
	modulesConfigWP.output.path = resolve( outputPath, 'build' );

	const syncDirectory = new SyncWebpackPlugin( {
		sourceDir: rootPath,
		targetDir: outputPath,
		exclude: [ /[\/\\]build[\/\\]/ ],
	} );

	modulesConfig.addPlugin( syncDirectory );
}

module.exports = [ modulesConfig.get() ];
