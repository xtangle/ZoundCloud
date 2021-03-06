import {expect} from 'chai';
import {UrlService} from 'src/ts/util/url-service';

describe('url service', () => {
  const fixture = UrlService;

  it('should get the current page\'s URL', () => {
    expect(fixture.getCurrentUrl()).to.be.equal(document.location.href);
  });
});
