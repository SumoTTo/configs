const chokidar = require( 'chokidar' );
const path = require( 'path' );
const fs = require( 'fs' );

function logError( label, error ) {
	// eslint-disable-next-line no-console
	console.error( label, error );
}

class SyncWebpackPlugin {
	constructor( options ) {
		this.options = options;
		this.ignored = new RegExp(
			[
				/(^|[\/\\])\..*|node_modules/.source,
				...this.options.exclude.map( ( regex ) => regex.source ),
			].join( '|' )
		);
	}

	// noinspection JSUnusedGlobalSymbols
	apply( compiler ) {
		compiler.hooks.run.tap( 'SumoTToSyncPlugin', () => {
			this.clearDirectory( this.options.targetDir );
			this.copyDirectory(
				this.options.sourceDir,
				this.options.targetDir
			);
		} );

		compiler.hooks.watchRun.tap( 'SumoTToSyncPlugin', () => {
			const watcher = chokidar.watch( this.options.sourceDir, {
				ignored: this.ignored,
				persistent: true,
			} );

			watcher
				.on( 'add', ( filePath ) => this.copyFile( filePath ) )
				.on( 'addDir', ( dirPath ) => this.copyDir( dirPath ) )
				.on( 'change', ( filePath ) => this.copyFile( filePath ) )
				.on( 'unlink', ( filePath ) => this.deleteFile( filePath ) )
				.on( 'unlinkDir', ( dirPath ) => this.deleteDir( dirPath ) )
				.on( 'error', ( error ) =>
					logError( 'Watcher error: ', error )
				);

			this.watcher = watcher;
		} );

		compiler.hooks.watchClose.tap( 'SumoTToSyncPlugin', () => {
			this.watcher.close().catch( ( err ) => {
				logError(
					'Error when stopping SumoTToSyncPlugin watch: ',
					err
				);
			} );
		} );
	}

	copyFile( filePath ) {
		const relativePath = path.relative( this.options.sourceDir, filePath );
		const destinationPath = path.join(
			this.options.targetDir,
			relativePath
		);

		const destinationDir = path.dirname( destinationPath );
		if ( ! fs.existsSync( destinationDir ) ) {
			fs.mkdirSync( destinationDir, { recursive: true } );
		}

		this.retryCopy( filePath, destinationPath );
	}

	retryCopy( filePath, destinationPath, retries = 5, delay = 100 ) {
		fs.copyFile( filePath, destinationPath, ( error ) => {
			if ( error ) {
				if ( error.code === 'EBUSY' && retries > 0 ) {
					setTimeout(
						() =>
							this.retryCopy(
								filePath,
								destinationPath,
								retries - 1,
								delay * 2
							),
						delay
					);
				} else {
					logError( 'File copy error: ', error );
				}
			}
		} );
	}

	copyDir( dirPath ) {
		const relativePath = path.relative( this.options.sourceDir, dirPath );
		const destinationPath = path.join(
			this.options.targetDir,
			relativePath
		);

		fs.mkdir( destinationPath, { recursive: true }, ( error ) => {
			if ( error ) {
				logError( 'Directory creation error: ', error );
			}
		} );
	}

	deleteFile( filePath ) {
		const sourceRelativePath = path.relative(
			this.options.sourceDir,
			filePath
		);
		const targetPath = path.join(
			this.options.targetDir,
			sourceRelativePath
		);

		fs.unlink( targetPath, ( error ) => {
			if ( error ) {
				logError( 'File deletion error: ', error );
			}
		} );
	}

	deleteDir( dirPath ) {
		const sourceRelativePath = path.relative(
			this.options.sourceDir,
			dirPath
		);
		const targetPath = path.join(
			this.options.targetDir,
			sourceRelativePath
		);

		if ( fs.lstatSync( targetPath ).isDirectory() ) {
			this.clearDirectory( targetPath, true );
			if ( fs.readdirSync( targetPath ).length === 0 ) {
				fs.rmdirSync( targetPath );
			}
		}
	}

	clearDirectory( dirPath, force = false ) {
		if ( fs.existsSync( dirPath ) ) {
			fs.readdirSync( dirPath ).forEach( ( file ) => {
				const curPath = path.join( dirPath, file );
				if ( false === force && this.ignored.test( curPath ) ) {
					return;
				}

				if ( fs.lstatSync( curPath ).isDirectory() ) {
					this.clearDirectory( curPath, force );
					if ( fs.readdirSync( curPath ).length === 0 ) {
						fs.rmdirSync( curPath );
					}
				} else {
					fs.unlinkSync( curPath );
				}
			} );
		}
	}

	copyDirectory( sourceDir, targetDir ) {
		if ( ! fs.existsSync( targetDir ) ) {
			fs.mkdirSync( targetDir );
		}

		fs.readdirSync( sourceDir ).forEach( ( file ) => {
			const source = path.join( sourceDir, file );
			const target = path.join( targetDir, file );

			if ( fs.lstatSync( source ).isDirectory() ) {
				this.copyDirectory( source, target );
			} else {
				fs.copyFileSync( source, target );
			}
		} );
	}
}

module.exports = SyncWebpackPlugin;
