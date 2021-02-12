import { TestBed } from '@angular/core/testing';

import { ControlService } from './control.service';

describe('SettingsService', () => {
  let service: ControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
