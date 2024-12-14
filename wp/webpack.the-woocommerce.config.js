const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const CleanWebpackPlugin = require( '../helpers/clean-webpack-plugin' );
const SyncWebpackPlugin = require( '../helpers/sync-webpack-plugin' );
const { resolve } = require( 'node:path' );
const { Config, defaultConfigWP, modulesConfigWP } = require( '../helpers/webpack' );
const findFreePort = require( 'find-free-port-sync' );
const rootPath = process.cwd().replace( /\\/g, '/' );
const outputPath = process.env.WP_CONTENT_DIR
	? resolve( process.env.WP_CONTENT_DIR, 'plugins/the-woocommerce' )
	: rootPath;
const port =
	process.env.WOOCOMMERCE_DEV_SERVER_PORT ||
	findFreePort( { start: 10000, end: 10999 } );

const defaultConfig = new Config( defaultConfigWP, 'default', port )
	.resetEntries()
	.addEntries(
		'src/styles/{*.{pc,sc,sa,c}ss,{blocks,variations,patterns}/**/*.{pc,sc,sa,c}ss}'
	)
	.addEntries( 'src/scripts/*.{j,t}s' )
	.changeRule( '/\\.(sc|sa)ss$/', ( rule ) => {
		const last = rule.use.length - 1;

		rule.use[ last ].options.sassOptions = {
			includePaths: [ resolve( rootPath, 'src/styles/partials' ) ],
		};
	} )
	.removePlugin( RtlCssPlugin )
	.addPlugin(
		new CleanWebpackPlugin( {
			patterns: [
				resolve( outputPath, 'build/**/*' ),
				'!' + resolve( outputPath, 'build/scripts/modules/**/*' ),
			],
		} )
	)
	.addPlugin(
		// For styles remove JS and styles .asset.php
		new RemoveEmptyScriptsPlugin( {
			enabled: ! Config.hasDevServer( defaultConfigWP ),
		} )
	);

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
	const buildPath = resolve( outputPath, 'build' );
	defaultConfigWP.output.path = buildPath;
	modulesConfigWP.output.path = buildPath;

	const syncDirectory = new SyncWebpackPlugin( {
		sourceDir: rootPath,
		targetDir: outputPath,
		exclude: [ /[\/\\]build[\/\\]/ ],
	} );

	defaultConfig.addPlugin( syncDirectory );
	modulesConfig.addPlugin( syncDirectory );
}

module.exports = [ defaultConfig.get(), modulesConfig.get() ];
