/*
import {ZC_DL_BUTTON_MEDIUM_CLASS, ZC_DL_BUTTON_ICON_CLASS} from '@src/constants';
import {ITrackInfo} from '@src/download/download-info';
import {DownloadInfoService} from '@src/download/download-info-service';
import {ReloadContentPageMessage} from '@src/messaging/extension/reload-content-page.message';
import {Message} from '@src/messaging/message';
import {IMessageHandlerArgs} from '@src/messaging/messenger';
import {ContentPageMessenger} from '@src/messaging/page/content-page-messenger';
import {RequestTrackDownloadMessage} from '@src/messaging/page/request-track-download.message';
import {TrackContentPage, ZC_TRACK_DL_BUTTON_ID} from '@src/page/track-content-page';
import {UrlService} from '@src/util/url-service';
import {useFakeTimer, configureChai, useSinonChrome} from '@test/test-initializers';
import {tick} from '@test/test-utils';
import * as $ from 'jquery';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {SinonSpy, SinonStub, spy, stub} from 'sinon';

const forEach = require('mocha-each');
const expect = configureChai();

describe('track content page', () => {
  let fixture: TrackContentPage;
  useSinonChrome();

  const testHtml = `
    <body>
      <div class="listenEngagement sc-clearfix">
        <div class="soundActions sc-button-toolbar soundActions__medium">
          <div id="button-group"><button id="button-1"/><button id="button-2"/></div>
        </div>
      </div>
    </body>
  `;

  beforeEach(() => {
    document.body.innerHTML = '<body></body>';
    fixture = new TrackContentPage();
  });

  afterEach(() => {
    fixture.unload();
  });

  context('testing when it should be loaded', () => {
    let stubGetUrl: SinonStub;

    beforeEach(() => {
      stubGetUrl = stub(UrlService, 'getCurrentUrl');
    });

    afterEach(() => {
      stubGetUrl.restore();
    });

    const validTrackPageUrls = [
      'https://soundcloud.com/some-user/some-track',
      'https://soundcloud.com/abcdefg/some-track?in=user/sets/playlist',
    ];

    const invalidTrackPageUrls = [
      'https://soundcloud.com/you/sets',
      'https://soundcloud.com/charts/top',
      'https://soundcloud.com/jobs/2017-12-18-ux-prototyper-berlin',
      'https://soundcloud.com/messages/140983555:5429995',
      'https://soundcloud.com/mobile/pulse',
      'https://soundcloud.com/pages/contact',
      'https://soundcloud.com/pro/gifts',
      'https://soundcloud.com/search/sets?q=asdf',
      'https://soundcloud.com/stations/artists/some-user',
      'https://soundcloud.com/settings/content',
      'https://soundcloud.com/tags/pop',

      'https://soundcloud.com/some-user',
      'https://soundcloud.com/some-user/albums',
      'https://soundcloud.com/some-user/comments',
      'https://soundcloud.com/some-user/followers',
      'https://soundcloud.com/some-user/following',
      'https://soundcloud.com/some-user/likes',
      'https://soundcloud.com/some-user/playlists',
      'https://soundcloud.com/some-user/reposts',
      'https://soundcloud.com/some-user/stats',
      'https://soundcloud.com/some-user/tracks',

      'https://soundcloud.com/some-user/sets/some-playlist',
      'https://soundcloud.com/terms-of-use#acceptance-of-terms-of-use',
      'https://soundcloud.com/discover/sets/new-for-you:140983555'
    ];

    forEach(validTrackPageUrls)
      .it('should test true when the URL is %s', (url: string) => {
        stubGetUrl.onFirstCall().returns(url);
        expect(fixture.test()).to.be.true;
      });

    forEach(invalidTrackPageUrls)
      .it('should test false when the URL is %s', (url: string) => {
        stubGetUrl.onFirstCall().returns(url);
        expect(fixture.test()).to.be.false;
      });

  });

  context('when it is loaded', () => {
    const fakeTrackInfo: ITrackInfo = {
      downloadable: false,
      id: 123,
      original_format: 'mp3',
      title: 'title',
      user: {username: 'foo'}
    };
    let fakeTrackInfo$: Subject<ITrackInfo>;
    let stubGetTrackInfo: SinonStub;

    beforeEach(() => {
      fakeTrackInfo$ = new Subject<ITrackInfo>();
      stubGetTrackInfo = stub(DownloadInfoService, 'getTrackInfo$');
      stubGetTrackInfo.withArgs(UrlService.getCurrentUrl()).returns(fakeTrackInfo$);
      stubGetTrackInfo.callThrough();
    });

    afterEach(() => {
      stubGetTrackInfo.restore();
    });

    describe('fetching the track info', () => {
      it('should have null track info initially', () => {
        fixture.load();
        verifyTrackInfoIs(null);
      });

      it('should update track info when it is fetched', () => {
        fixture.load();
        fakeTrackInfo$.next(fakeTrackInfo);
        verifyTrackInfoIs(fakeTrackInfo);
      });
    });

    describe('reloading the content page', () => {
      let fakeMessageHandlerArgs$: Subject<IMessageHandlerArgs<Message>>;
      let stubOnMessage: SinonStub;
      let spyReload: SinonSpy;

      beforeEach(() => {
        fakeMessageHandlerArgs$ = new Subject<IMessageHandlerArgs<Message>>();
        stubOnMessage = stub(ContentPageMessenger, 'onMessage');
        stubOnMessage.withArgs(ReloadContentPageMessage.TYPE).returns(fakeMessageHandlerArgs$);
        spyReload = spy(fixture, 'reload');
      });

      beforeEach('load fixture and populate initial track info', () => {
        fixture.load();
        fakeTrackInfo$.next(fakeTrackInfo);
      });

      afterEach(() => {
        stubOnMessage.restore();
        spyReload.restore();
      });

      it('should not reload when no reload message is received', () => {
        expect(spyReload).to.not.have.been.called;
      });

      it('should reload when a reload message is received and type match', () => {
        fakeMessageHandlerArgs$.next({message: new ReloadContentPageMessage(fixture.type), sender: null});
        expect(spyReload).to.have.been.calledOnce;
      });

      it('should not reload when reload message is received and type does not match', () => {
        const differentType = fixture.type + 'X';
        fakeMessageHandlerArgs$.next({message: new ReloadContentPageMessage(differentType), sender: null});
        expect(spyReload).to.not.have.been.called;
      });

      context('when it is reloaded', () => {
        beforeEach(() => {
          fixture.reload();
        });

        it('should reset track info to null', () => {
          verifyTrackInfoIs(null);
        });

        it('should update track info when it is fetched', () => {
          fakeTrackInfo$.next(fakeTrackInfo);
          verifyTrackInfoIs(fakeTrackInfo);
        });
      });
    });

    describe('the download button injection', () => {
      it('should be injected when the listen engagement toolbar already exists', () => {
        document.body.innerHTML = testHtml;
        fixture.load();
        verifyDlButtonIsInDOM();
      });

      it('should be injected when the listen engagement toolbar is added', async () => {
        fixture.load();
        await tick();

        verifyDlButtonIsNotInDOM();
        const listenEngagement = $(testHtml).filter('.listenEngagement');
        $('body').append(listenEngagement);
        await tick();

        verifyDlButtonIsInDOM();
      });

      it('should not be injected when the button group cannot be found', () => {
        document.body.innerHTML = testHtml;
        $(`#button-group`).remove();
        fixture.load();
        verifyDlButtonIsNotInDOM();
      });
    });

    describe('the download button behavior', () => {
      const cw = useFakeTimer();

      beforeEach('ensure download button is injected', () => {
        document.body.innerHTML = testHtml;
        fixture.load();
      });

      it('should have the correct classes', () => {
        const selector = '.sc-button.sc-button-medium.sc-button-responsive' +
          `.${ZC_DL_BUTTON_ICON_CLASS}.${ZC_DL_BUTTON_MEDIUM_CLASS}`;
        expect(getDlButton().is(selector)).to.be.true;
      });

      it('should have the correct label', () => {
        expect(getDlButton().html()).to.be.equal('Download');
      });

      it('should have the correct title', () => {
        expect(getDlButton().prop('title')).to.be.equal('Download this track');
      });

      it('should be added as the last child of the button group if the last button is not the More button', () => {
        expect($('#button-group').find('button:last-child').is(getDlButton())).to.be.true;
      });

      it('should be added as the second-to-last child of the button group ' +
        'if the last button is the More button', () => {
        fixture.unload();
        const btnGroup = $('#button-group');
        const moreBtn = $('<button/>').addClass('sc-button-more');
        btnGroup.append(moreBtn);
        fixture.load();
        expect(btnGroup.find('button:nth-last-child(2)').is(getDlButton())).to.be.true;
      });

      describe('the behavior when clicked', () => {
        let stubSendToExtension: SinonStub;

        beforeEach(() => {
          stubSendToExtension = stub(ContentPageMessenger, 'sendToExtension');
        });

        afterEach(() => {
          stubSendToExtension.restore();
        });

        it('should send a request download message if there is track info', () => {
          fakeTrackInfo$.next(fakeTrackInfo);
          getDlButton().trigger('click');
          expect(stubSendToExtension).to.have.been.calledOnce
            .calledWithExactly(new RequestTrackDownloadMessage(fakeTrackInfo));
        });

        it('should not send a request download message if there is no track info', () => {
          getDlButton().trigger('click');
          expect(stubSendToExtension).to.not.have.been.called;
        });

        it('should send a request download message if track info is received within 30s', () => {
          getDlButton().trigger('click');
          cw.clock.tick(29999);
          fakeTrackInfo$.next(fakeTrackInfo);
          expect(stubSendToExtension).to.have.been.calledOnce
            .calledWithExactly(new RequestTrackDownloadMessage(fakeTrackInfo));
        });

        it('should not send a request download message if track info is not received within 30s', () => {
          getDlButton().trigger('click');
          cw.clock.tick(30001);
          fakeTrackInfo$.next(fakeTrackInfo);
          expect(stubSendToExtension).to.not.have.been.called;
        });

        it('should not send a request download message when not clicked', () => {
          fakeTrackInfo$.next(fakeTrackInfo);
          expect(stubSendToExtension).to.not.have.been.called;
        });

        it('should not send a request download message for old track info ' +
          'when page is reloaded with the new track info', () => {
          getDlButton().trigger('click');
          fixture.reload();
          fakeTrackInfo$.next(fakeTrackInfo);
          expect(stubSendToExtension).to.not.have.been.called;
        });

        it('should throttle clicks that are within 3s of each other', () => {
          fakeTrackInfo$.next(fakeTrackInfo);
          getDlButton().trigger('click');
          cw.clock.tick(2900);
          getDlButton().trigger('click');
          expect(stubSendToExtension).to.have.been.calledOnce;

          cw.clock.tick(101);
          getDlButton().trigger('click');
          expect(stubSendToExtension).to.have.been.calledTwice;
        });
      });
    });

    function verifyTrackInfoIs(trackInfo: ITrackInfo) {
      const TRACK_INFO_KEY = 'trackInfo$';
      expect((fixture[TRACK_INFO_KEY] as BehaviorSubject<ITrackInfo>).getValue()).to.be.equal(trackInfo);
    }
  });

  context('when the content page is unloaded', () => {
    beforeEach('add download button to DOM', () => {
      document.body.innerHTML = testHtml;
      const dlButton = $('<button/>').attr('id', ZC_TRACK_DL_BUTTON_ID);
      $(`#button-group`).append(dlButton);
    });

    it('should remove the download button', () => {
      fixture.unload();
      verifyDlButtonIsNotInDOM();
    });

    it('should unsubscribe from all subscriptions', () => {
      const SUBS_PROP = 'subscriptions';
      const spyUnsubscribe = spy((fixture as any)[SUBS_PROP] as Subscription, 'unsubscribe');
      fixture.unload();
      expect(spyUnsubscribe).to.be.called;
    });
  });

  function getDlButton(): JQuery<HTMLElement> {
    return $(`#${ZC_TRACK_DL_BUTTON_ID}`);
  }

  function verifyDlButtonIsInDOM() {
    expect(getDlButton().length).to.be.equal(1, 'download button is not in DOM when it should be');
  }

  function verifyDlButtonIsNotInDOM() {
    expect(getDlButton().length).to.be.equal(0, 'download button is in DOM when it should not be');
  }
});
*/
