#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface ShakeEventEmitter : RCTEventEmitter <RCTBridgeModule>
@end

@implementation ShakeEventEmitter

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"ShakeEvent"];
}

- (void)startObserving {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleShake:)
                                               name:@"ShakeEvent"
                                             object:nil];
}

- (void)stopObserving {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleShake:(NSNotification *)notification {
  [self sendEventWithName:@"ShakeEvent" body:nil];
}

@end
