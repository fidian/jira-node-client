const test = require('unit.js');
const testThat = test.promise;
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const rewire = require('rewire');
const cookie = rewire('../lib/cookieAuthentication.js');
const requestify = require('requestify');
const getBaseUrl = cookie.__get__('getBaseUrl');
const extract = cookie.__get__('extractSessionCookie');

before(() => chai.use(chaiAsPromised));

beforeEach(() => sandbox = sinon.sandbox.create());

afterEach(() => sandbox.restore());


describe('getBaseUrl', () => {
  it('getBaseUrl() returns base url if valid url', () => {
    let url = 'http://www.dummyserver:23456/rest/api/2/issue/ID-5';
    expect(getBaseUrl(url)).to.equal('http://www.dummyserver:23456/rest/');
  });
  it('getBaseUrl() throw error if missing url', () => {
    expect(() => getBaseUrl()).to.throw(Error);
  });
  it('getBaseUrl() throw error if invalid url', () => {
    let url = 'http://www.dummyserver:23456/bla/bla/bla';
    expect(() => getBaseUrl(url)).to.throw(Error);
  });

  describe('extractSessionCookie', () => {
    it('extractSessionCookie() throw error if cookie name not specified', () => {
      expect(() => extract(['fake="KHG8768"'])).to.throw(Error);
    });
    it('extractSessionCookie() throw error if cookies not specified', () => {
      expect(() => extract()).to.throw(Error);
    });
    it('extractSessionCookie() throw error if cookies is not an array', () => {
      expect(() => extract('fake="KHG987J"', 'fake')).to.throw(Error);
    });
    it('extractSessionCookie() returns sessionCookie when only one cookie', () => {
      expect(extract(['cookie1="LKJHLKJ8768H"'], 'cookie1')).to.equal('cookie1="LKJHLKJ8768H"');
    });
    it('extractSessionCookie() throw error if cookie name not found in cookies', () => {
      expect(() => extract(['cookie1="LKJHLKJ8768H"'], 'cookie2')).to.throw(Error);
    });
    it('extractSessionCookie() returns sessionCookie when multiple cookies', () => {
      expect(extract(['cookie1="LKJHLKJ8768H"', 'cookie2="KJHG76KHJB"', 'cookie3="JRS8MLKJKJF"', 'cookie4="JH8976HGFCJ"'], 'cookie3')).to.equal('cookie3="JRS8MLKJKJF"');
    });
    it('extractSessionCookie() returns sessionCookie when multiple cookies and empty cookie with cookie name ignored', () => {
      expect(extract(['cookie1="LKJHLKJ8768H"', 'cookie2="KJHG76KHJB"', 'cookie3=""', 'cookie3="JH8976HGFCJ"'], 'cookie3')).to.equal('cookie3="JH8976HGFCJ"');
    });
  });

  describe('getCookie', () => {
    it('getCookie() rejects with if url not set', () => {
      return expect(cookie.getCookie('user', 'password')).to.eventually.be.rejected
        .then((error) => {
          expect(error).to.be.an.instanceof(Error);
        });
    });
    it('getCookie() rejects if no cookie is in header', () => {
      sandbox.stub(requestify, 'post', (url, body, option) => {
        let headers = {'set-cookie': ''};
        let response = '{"session": {"name": "studio.crowd.tokenkey"}}';
        return Promise.resolve({code: 200, headers: headers, body: response});
      });
      expect(cookie.getCookie('dummy-user', 'dummy-password', 'http://www.dummyurl/rest/api/2/issue/ID-78')).to.eventually.be.fulfilled;
    });
    it('getCookie() returns session Cookie', () => {
      sandbox.stub(requestify, 'post', (url, body, option) => {
        let headers = {'set-cookie': ['atlassian.xsrf.token=BGJJ-I70H-EYI8-6QPB|2ae8e3125acff97369f184a4530b59f9d983c12d|lout; Path=/; Secure', 'JSESSIONID=913F47DAFCA6D7FF09A65537D5BD3C5C; Path=/; Secure; HttpOnly', 'studio.crowd.tokenkey=""; Domain=.ulyssjira2.atlassian.net; Expires=Thu, 01-Jan-1970 00:00:10 GMT; Path=/; Secure; HttpOnly', 'studio.crowd.tokenkey=gW34EFQfK8Kbwpp6HkHmng00; Domain=.ulyssjira2.atlassian.net; Path=/; Secure; HttpOnly']};
        let response = '{"session": {"name": "studio.crowd.tokenkey"}, "loginInfo": {"failedLoginCount": 1, "loginCount": 230, "lastFailedLoginTime": "2017-01-17T10:20:43.467+0100", "previousLoginTime": "2017-01-17T17:11:46.798+0100"}}';
        return Promise.resolve({code: 200, headers: headers, body: response});
      });
      return expect(cookie.getCookie('dummy-user', 'dummy-password', 'http://www.dummyurl/rest/api/2/issue/ID-78')).to.eventually.be.fulfilled
        .then((cookie) => {
          expect(cookie).to.equal('studio.crowd.tokenkey=gW34EFQfK8Kbwpp6HkHmng00');
        });
    });
  });
});
