const fetch = require( 'node-fetch' );
const diff = require( 'diff' );
const fs = require( 'fs/promises' );
const path = require( 'path' );


const httpStatusCodesUrl = 'https://www.iana.org/assignments/http-status-codes/http-status-codes.txt';

const checkForUpdate = async ( { github, core } ) => {
	try
	{
		const httpStatusCodes = await fetchHttpStatusCodesList();
		const diffWithLastUsedVersion = await getDiffWithLastUsedVersion( httpStatusCodes.httpStatusCodesList );
		if ( !diffWithLastUsedVersion ) {
			return;
		}
		const existingGithubIssues = await searchForExistingGithubIssue( httpStatusCodes.lastUpdated, github );

		if ( existingGithubIssues.total_count === 0 ) {
			const newIssue = await createNewGithubIssue( httpStatusCodes, diffWithLastUsedVersion, github );
			core.info( `Created issue #${newIssue.number}: ${newIssue.html_url}`);
		}
		else if ( existingGithubIssues.total_count === 1 ) {
			core.info( 'HTTP status codes are still up to date.' );
		}
		else {
			core.warning( `Multiple issues exist for the HTTP status code update from ${httpStatusCodes.lastUpdated}` );
		}
	}
	catch ( error ) {
		core.setFailed( `Could not check for HTTP status codes updates: ${error}` );
		throw error;
	}
};

const fetchHttpStatusCodesList = async () => {
	const response = await fetch( httpStatusCodesUrl );
	if ( !response.ok ) {
		throw Error( `Error fetching HTTP status codes list: ${response.status} ${response.statusText}` );
	}
	const httpStatusCodesList = await response.text();

	const match = /Last Updated\s+(\d{4}-\d{2}-\d{2})/.exec( httpStatusCodesList );
	if ( !match ) {
		throw Error( 'Could not find "Last Updated" date in HTTP status list' );
	}
	const lastUpdated = match[ 1 ];
	return { lastUpdated, httpStatusCodesList };
};

const issueTitleBase = 'IANA HTTP Status Code Update';

const searchForExistingGithubIssue = async ( lastUpdatedDate, github ) => {
	const query = [ issueTitleBase, lastUpdatedDate, 'in:title', 'repo:j-ulrich/http-status-codes-cpp', 'type:issue' ].join( '+' );
	const searchResult = await github.search.issuesAndPullRequests( {
		q: query,
	} );
	return searchResult;
};

const createNewGithubIssue = async ( httpStatusCodes, diffWithLastUsedVersion, github ) => {
	
	return github.issues.create( {
		owner: 'j-ulrich',
		repo: 'http-status-codes-cpp',
		title: `${issueTitleBase} ${httpStatusCodes.lastUpdatedDate}`,
		body: `The HTTP status codes list has been updated on ${httpStatusCodes.lastUpdatedDate}.` + '\n' +
		      'See https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml' + '\n\n' +
		      '## Diff ##'  + '\n' +
			  '```diff'  + '\n' +
			  diffWithLastUsedVersion + '\n' +
			  '```'
	} );
};

const getDiffWithLastUsedVersion = async ( httpStatusCodeList ) => {
	const pathToLastUsedVersion = path.resolve( './.github/http-status-codes.txt' );
	const lastUsedVersion = await fs.readFile( pathToLastUsedVersion, { encoding: 'utf-8' } );
	if ( lastUsedVersion === httpStatusCodeList ) {
		return null;
	}
	const patch = diff.createPatch( 'http-status-codes.txt', lastUsedVersion, httpStatusCodeList );
	return patch;
};

const main = async () => {
	try
	{
		const httpStatusCodes = await fetchHttpStatusCodesList();
		console.log( httpStatusCodes.lastUpdated );
		const patch = await getDiffWithLastUsedVersion( httpStatusCodes.httpStatusCodesList );
		if ( patch ) {
			console.log( patch );
		}
	}
	catch( reason ) {
		console.error( reason );
		process.exitCode = -1;
	};
};

module.exports = checkForUpdate;

if ( require.main === module ) {
	main();
}