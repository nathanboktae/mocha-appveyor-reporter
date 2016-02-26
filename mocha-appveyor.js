function AppVeyorReporter(runner) {
  var requestJson = require('request-json');
  var deasync = require('deasync');

  var tests = [];

  var mapTest = function(test) {
    return {
      testName: test.fullTitle(),
      testFramework: 'Mocha',
      fileName: test.file,
      outcome: test.state === 'passed' ? 'Passed' : undefined,
      durationMilliseconds: test.duration
    }
  }

  runner.on('pass', function(test){
    tests.push(mapTest(test))
  })

  runner.on('pending', function(mochaTest) {
    var test = mapTest(mochaTest)
    test.outcome = 'Ignored'
    tests.push(test)
  })

  runner.on('fail', function(mochaTest, err) {
    var test = mapTest(mochaTest)
    test.outcome = 'Failed'
    test.ErrorMessage = err.message
    test.ErrorStackTrace = err.stack
    tests.push(test)
  })

  runner.on('end', function(failures) {
	var errData;
	var done;
	
    requestJson.newClient(process.env.APPVEYOR_API_URL).post('api/tests/batch', tests, function(err, body, resp) {
	  done = true;
      errData = err;
    })
	
	deasync.loopWhile(function() {
		return !done;
	});
  })
}

module.exports = AppVeyorReporter