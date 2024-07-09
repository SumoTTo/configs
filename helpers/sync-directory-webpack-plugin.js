const syncDirectory = require( 'sync-directory' );

class SyncDirectoryWebpackPlugin {
	constructor( options ) {
		this.sourceDir = options.sourceDir;
		this.targetDir = options.targetDir;
		this.watcher = syncDirectory( this.sourceDir, this.targetDir, {
			skipInitialSync: false,
			watch: true,
			deleteOrphaned: true,
			exclude: 'node_modules',
		} );
	}

	// noinspection JSUnusedGlobalSymbols
	apply( compiler ) {
		compiler.hooks.done.tap( 'SyncDirectoryPlugin', () => {
			if ( 'development' !== compiler.options.mode ) {
				// noinspection JSUnresolvedReference
				this.watcher.close();
			}
		} );
	}
}

module.exports = SyncDirectoryWebpackPlugin;
