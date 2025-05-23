import imgAvatar from '@app/assets/bgimages/default-user.svg';
import logo from '@app/assets/bgimages/empty.svg';
import forkLogo from '@app/assets/bgimages/fork.svg';
import githubLogo from '@app/assets/bgimages/github-mark-white.svg';
import parasolLogo from '@app/assets/bgimages/parasol-logo.svg';
import starLogo from '@app/assets/bgimages/star.svg';
import config from '@app/config';
import { IAppRoute, IAppRouteGroup, routes } from '@app/routes';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertProps,
  Avatar,
  Brand,
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  MenuToggleElement,
  Modal,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  NotificationBadge,
  NotificationBadgeVariant,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Page,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Popover,
  SkipToContent,
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem
} from '@patternfly/react-core';
import { BarsIcon, EllipsisVIcon, QuestionCircleIcon, SearchIcon } from '@patternfly/react-icons';
import axios from 'axios';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import Emitter from '../../utils/emitter';

interface IAppLayout {
  children: React.ReactNode;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {

  const [parasolMode, setParasolMode] = React.useState(false);
  const [repoStars, setRepoStars] = React.useState<number | null>(null);
  const [repoForks, setRepoForks] = React.useState<number | null>(null);
  const [userName, setUserName] = React.useState<string>('');

  interface NotificationProps {
    title: string;
    srTitle: string;
    variant: 'custom' | 'success' | 'danger' | 'warning' | 'info';
    key: React.Key;
    timestamp: string;
    description: string;
    isNotificationRead: boolean;
  }

  // Fetch settings
  React.useEffect(() => {
    axios.get(`${config.backend_api_url}/settings/parasol-mode`)
      .then((response) => {
        setParasolMode(response.data.parasolMode === 'true');
        console.log('Parasol mode: ' + parasolMode);
      })
      .catch((error) => {
        console.error(error);
        Emitter.emit('error', 'Failed to fetch configuration settings.');
      });

    const handleNotification = (data) => {
      addNewNotification(data.variant, data.title, data.description);
    }

    Emitter.on('notification', handleNotification);

    // Clean up the subscription when the component unmounts
    return () => {
      Emitter.off('notification', handleNotification);
    };
  }, []);

  // Fetch user name
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get headers from current page
        const response = await fetch(window.location.href, { 
          method: 'HEAD',
          credentials: 'same-origin' // Include cookies in the request
        });
        
        const entries = [...response.headers.entries()];
        const gapAuthHeader = entries.find(entry => entry[0] === 'gap-auth');
        const gapAuthValue = gapAuthHeader ? gapAuthHeader[1] : '';
        setUserName(gapAuthValue);
        
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }
    fetchUserInfo();
  }, []);

  // Fetch GitHub stars and forks
  React.useEffect(() => {
    axios.get('https://api.github.com/repos/rh-aiservices-bu/image-generation-on-openshift')
      .then((response) => {
        setRepoStars(response.data.stargazers_count);
        setRepoForks(response.data.forks_count);
      })
      .catch((error) => {
        console.error('Failed to fetch GitHub stars:', error);
      });
  }, []);

  /* const [sidebarOpen, setSidebarOpen] = React.useState(true); */
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');

  const onChangeLanguage = (_event: React.FormEvent<HTMLSelectElement>, language: string) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
  };

  //i18n
  const { t, i18n } = useTranslation();
  React.useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
  }, [selectedLanguage]);


  const location = useLocation();

  const renderNavItem = (route: IAppRoute, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={route.path.split('/')[1] === location.pathname.split('/')[1]} className='navitem-flex'>
      <NavLink exact={route.exact} to={route.path} className={route.path !== '#' ? '' : 'disabled-link'}>
        {t(route.label as string)}
      </NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: IAppRouteGroup, groupIndex: number) => (
    <NavExpandable
      key={`${group.label}-${groupIndex}`}
      id={`${group.label}-${groupIndex}`}
      title={group.label}
      isActive={group.routes.some((route) => route.path === location.pathname)}
      isExpanded={group.isExpanded}
    >
      {group.routes.map((route, idx) => route.label && renderNavItem(route, idx))}
    </NavExpandable>
  );

  const Navigation = (
    <Nav id="nav-first-simple" theme="dark">
      <NavList id="nav-list-first-simple">
        {routes.map(
          (route, idx) => {
            if ('path' in route) {
              // This route is an IAppRoute because it has a 'path' property
              return route.label && renderNavItem(route, idx);
            } else if ('routes' in route) {
              // This route is an IAppRouteGroup because it has a 'routes' property
              return route.label && renderNavGroup(route, idx);
            }
            return null;
          }
        )}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar theme="dark" >
      <PageSidebarBody isFilled style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {Navigation}
        <div style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center' }}>
          <Text component={TextVariants.small}>
            PoC App by <a href='http://red.ht/cai-team' target='_blank'>red.ht/cai-team</a>
            <br />
            <Flex direction={{ default: 'column' }} style={{ width: '100%', alignItems: 'center' }}>
              <FlexItem style={{ marginBottom: '0rem' }}>
                <Flex direction={{ default: 'row' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <a href='https://github.com/rh-aiservices-bu/image-generation-on-openshift' target='_blank' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <FlexItem>
                      <img src={githubLogo} alt="GitHub Logo" style={{ height: '20px', marginRight: '0.5rem' }} />
                    </FlexItem>
                    <FlexItem>
                      <Text>Source on GitHub</Text>
                    </FlexItem>
                  </a>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Flex direction={{ default: 'row' }}>
                  <FlexItem style={{ alignmentBaseline: 'middle' }}>
                    {repoStars !== null &&
                      <img src={starLogo} alt="Star Logo" style={{ height: '15px', marginRight: '0.5rem', verticalAlign: 'text-top' }} />
                    }
                    {repoStars !== null ? `${repoStars}` : ''}
                  </FlexItem>
                  <FlexItem>
                    {repoStars !== null &&
                      <img src={forkLogo} alt="Fork Logo" style={{ height: '15px', marginRight: '0.5rem', verticalAlign: 'text-top' }} />
                    }
                    {repoForks !== null ? `${repoForks}` : ''}
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>

          </Text>
        </div>
      </PageSidebarBody>
    </PageSidebar>
  );

  // Notifications
  const maxDisplayedAlerts = 3;
  const minAlerts = 0;
  const maxAlerts = 100;
  const alertTimeout = 8000;

  const [isDrawerExpanded, setDrawerExpanded] = React.useState(false);
  const [openDropdownKey, setOpenDropdownKey] = React.useState<React.Key | null>(null);
  const [overflowMessage, setOverflowMessage] = React.useState<string>('');
  const [maxDisplayed, setMaxDisplayed] = React.useState(maxDisplayedAlerts);
  const [alerts, setAlerts] = React.useState<React.ReactElement<AlertProps>[]>([]);
  const [notifications, setNotifications] = React.useState<NotificationProps[]>([]);

  React.useEffect(() => {
    setOverflowMessage(buildOverflowMessage());
  }, [maxDisplayed, notifications, alerts]);

  const addNewNotification = (variant: NotificationProps['variant'], inputTitle, description) => {
    const variantFormatted = variant.charAt(0).toUpperCase() + variant.slice(1);
    let title = '';
    if (inputTitle !== '') {
      title = variantFormatted + ' - ' + inputTitle;
    } else {
      title = variantFormatted;
    }
    const srTitle = variantFormatted + ' alert';
    const key = getUniqueId();
    const timestamp = getTimeCreated();

    setNotifications((prevNotifications) => [
      { title, srTitle, variant, key, timestamp, description, isNotificationRead: false },
      ...prevNotifications
    ]);

    if (!isDrawerExpanded) {
      setAlerts((prevAlerts) => [
        <Alert
          variant={variant}
          title={title}
          timeout={alertTimeout}
          onTimeout={() => removeAlert(key)}
          isLiveRegion
          actionClose={
            <AlertActionCloseButton title={title} variantLabel={`${variant} alert`} onClose={() => removeAlert(key)} />
          }
          key={key}
          id={key.toString()}
        >
          <p>{description}</p>
        </Alert>,
        ...prevAlerts
      ]);
    }
  };

  const removeNotification = (key: React.Key) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.key !== key));
  };

  const removeAllNotifications = () => {
    setNotifications([]);
  };

  const isNotificationRead = (key: React.Key) =>
    notifications.find((notification) => notification.key === key)?.isNotificationRead;

  const markNotificationRead = (key: React.Key) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.key === key ? { ...notification, isNotificationRead: true } : notification
      )
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, isNotificationRead: true }))
    );
  };

  const getUnreadNotificationsNumber = () =>
    notifications.filter((notification) => notification.isNotificationRead === false).length;

  const containsUnreadAlertNotification = () =>
    notifications.filter(
      (notification) => notification.isNotificationRead === false && notification.variant === 'danger'
    ).length > 0;

  const getNotificationBadgeVariant = () => {
    if (getUnreadNotificationsNumber() === 0) {
      return NotificationBadgeVariant.read;
    }
    if (containsUnreadAlertNotification()) {
      return NotificationBadgeVariant.attention;
    }
    return NotificationBadgeVariant.unread;
  };

  const onNotificationBadgeClick = () => {
    removeAllAlerts();
    setDrawerExpanded(!isDrawerExpanded);
  };

  const onDropdownToggle = (id: React.Key) => {
    if (id && openDropdownKey !== id) {
      setOpenDropdownKey(id);
      return;
    }
    setOpenDropdownKey(null);
  };

  const onDropdownSelect = () => {
    setOpenDropdownKey(null);
  };

  const buildOverflowMessage = () => {
    const overflow = alerts.length - maxDisplayed;
    if (overflow > 0 && maxDisplayed > 0) {
      return `View ${overflow} more notification(s) in notification drawer`;
    }
    return '';
  };

  const getUniqueId = () => new Date().getTime();

  const getTimeCreated = () => {
    const dateCreated = new Date();
    return (
      dateCreated.toDateString() +
      ' at ' +
      ('00' + dateCreated.getHours().toString()).slice(-2) +
      ':' +
      ('00' + dateCreated.getMinutes().toString()).slice(-2)
    );
  };

  const removeAlert = (key: React.Key) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.props.id !== key.toString()));
  };

  const removeAllAlerts = () => {
    setAlerts([]);
  };

  const onAlertGroupOverflowClick = () => {
    removeAllAlerts();
    setDrawerExpanded(true);
  };

  const onMaxDisplayedAlertsMinus = () => {
    setMaxDisplayed(normalizeAlertsNumber(maxDisplayed - 1));
  };

  const onMaxDisplayedAlertsChange = (event: any) => {
    setMaxDisplayed(normalizeAlertsNumber(Number(event.target.value)));
  };

  const onMaxDisplayedAlertsPlus = () => {
    setMaxDisplayed(normalizeAlertsNumber(maxDisplayed + 1));
  };

  const normalizeAlertsNumber = (value: number) => Math.max(Math.min(value, maxAlerts), minAlerts);

  const alertButtonStyle = { marginRight: '8px', marginTop: '8px' };

  const notificationBadge = (
    <ToolbarItem>
      <NotificationBadge
        variant={getNotificationBadgeVariant()}
        onClick={onNotificationBadgeClick}
        aria-label="Notifications"
      ></NotificationBadge>
    </ToolbarItem>
  );

  const notificationDrawerActions = (
    <>
      <DropdownItem key="markAllRead" onClick={markAllNotificationsRead}>
        Mark all read
      </DropdownItem>
      <DropdownItem key="clearAll" onClick={removeAllNotifications}>
        Clear all
      </DropdownItem>
    </>
  );
  const notificationDrawerDropdownItems = (key: React.Key) => [
    <DropdownItem key={`markRead-${key}`} onClick={() => markNotificationRead(key)}>
      Mark as read
    </DropdownItem>,
    <DropdownItem key={`clear-${key}`} onClick={() => removeNotification(key)}>
      Clear
    </DropdownItem>
  ];

  const notificationDrawer = (
    <NotificationDrawer>
      <NotificationDrawerHeader count={getUnreadNotificationsNumber()} onClose={(_event) => setDrawerExpanded(false)}>
        <Dropdown
          id="notification-drawer-0"
          isOpen={openDropdownKey === 'dropdown-toggle-id-0'}
          onSelect={onDropdownSelect}
          popperProps={{ position: 'right' }}
          onOpenChange={(isOpen: boolean) => !isOpen && setOpenDropdownKey(null)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={openDropdownKey === 'dropdown-toggle-id-0'}
              variant="plain"
              onClick={() => onDropdownToggle('dropdown-toggle-id-0')}
              aria-label="Notification drawer actions"
            >
              <EllipsisVIcon aria-hidden="true" />
            </MenuToggle>
          )}
        >
          <DropdownList>{notificationDrawerActions}</DropdownList>
        </Dropdown>
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        {notifications.length !== 0 && (
          <NotificationDrawerList>
            {notifications.map(({ key, variant, title, srTitle, description, timestamp }, index) => (
              <NotificationDrawerListItem
                key={key}
                variant={variant}
                isRead={isNotificationRead(key)}
                onClick={() => markNotificationRead(key)}
              >
                <NotificationDrawerListItemHeader variant={variant} title={title} srTitle={srTitle}>
                  <Dropdown
                    id={key.toString()}
                    isOpen={openDropdownKey === key}
                    onSelect={onDropdownSelect}
                    popperProps={{ position: 'right' }}
                    onOpenChange={(isOpen: boolean) => !isOpen && setOpenDropdownKey(null)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        isExpanded={openDropdownKey === key}
                        variant="plain"
                        onClick={() => onDropdownToggle(key)}
                        aria-label={`Notification ${index + 1} actions`}
                      >
                        <EllipsisVIcon aria-hidden="true" />
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>{notificationDrawerDropdownItems(key)}</DropdownList>
                  </Dropdown>
                </NotificationDrawerListItemHeader>
                <NotificationDrawerListItemBody timestamp={timestamp}> {description} </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
            ))}
          </NotificationDrawerList>
        )}
        {notifications.length === 0 && (
          <EmptyState variant={EmptyStateVariant.full}>
            <EmptyStateHeader
              headingLevel="h2"
              titleText="No notifications found"
              icon={<EmptyStateIcon icon={SearchIcon} />}
            />
            <EmptyStateBody>There are currently no notifications.</EmptyStateBody>
          </EmptyState>
        )}
      </NotificationDrawerBody>
    </NotificationDrawer>
  );

  const headerToolbar = (
    <Toolbar id="toolbar" isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="icon-button-group"
          align={{ default: 'alignRight' }}
          spacer={{ default: 'spacerMd', md: 'spacerMd' }}
        >
          {notificationBadge}
          <ToolbarItem>
            <Popover
              aria-label="Help"
              position="right"
              headerContent={t('app_header.help.header')}
              bodyContent={t('app_header.help.body')}
              footerContent={t('app_header.help.footer')}
            >
              <Button aria-label="Help" variant={ButtonVariant.plain} icon={<QuestionCircleIcon />} />
            </Popover>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem>
          <TextContent>
            <Text component={TextVariants.p} className='pf-v5-global--spacer--md'>
              {userName}
            </Text>
          </TextContent>
        </ToolbarItem>
        <ToolbarItem>
          <Avatar src={imgAvatar} alt="" border='light' className='avatar' />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const Header = (
    <Masthead role="banner" aria-label="page masthead">
      <MastheadToggle>
        <PageToggleButton id="page-nav-toggle" variant="plain" aria-label="Dashboard navigation">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={parasolMode ? parasolLogo : logo} alt="Patternfly Logo" heights={{ default: '36px' }} />
          <TextContent>
            <Text component={TextVariants.h2} className='title-text'>Stable Diffusion XL Mini Studio</Text>
          </TextContent>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {headerToolbar}
      </MastheadContent>
    </Masthead>
  );

  const pageId = 'primary-app-container';

  const PageSkipToContent = (
    <SkipToContent onClick={(event) => {
      event.preventDefault();
      const primaryContentContainer = document.getElementById(pageId);
      primaryContentContainer && primaryContentContainer.focus();
    }} href={`#${pageId}`}>
      Skip to Content
    </SkipToContent>
  );

  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = React.useState(false);
  const handleDisclaimerModalToggle = () => {
    setIsDisclaimerModalOpen(!isDisclaimerModalOpen);
  }

  // Load disclaimer status at startup by calling the backend API
  React.useEffect(() => {
    axios.get(`${config.backend_api_url}/disclaimer`)
      .then((response) => {
        if (response.data.disclaimer.status === 'accepted') {
          console.log('Disclaimer already accepted');
        } else {
          setIsDisclaimerModalOpen(true);
        }
      })
      .catch((error) => {
        console.log(error);
        setIsDisclaimerModalOpen(true);
      });
  }, []);

  // Save disclaimer status to the backend API
  const saveDisclaimerStatus = () => {
    axios.put(`${config.backend_api_url}/disclaimer`, { status: 'accepted' })
      .then((response) => {
        setIsDisclaimerModalOpen(false);
        console.log(response);
      })
      .catch((error) => {
        setIsDisclaimerModalOpen(false);
        console.log(error);
      });
  }

  return (
    <Page
      mainContainerId={pageId}
      header={Header}
      sidebar={Sidebar}
      skipToContent={PageSkipToContent}
      notificationDrawer={notificationDrawer}
      isNotificationDrawerExpanded={isDrawerExpanded}
      isManagedSidebar
    >
      {children}
      <AlertGroup isToast isLiveRegion onOverflowClick={onAlertGroupOverflowClick} overflowMessage={overflowMessage}>
        {alerts.slice(0, maxDisplayed)}
      </AlertGroup>
      <Modal
        title={"Disclaimer"}
        titleIconVariant="info"
        className="bucket-modal"
        isOpen={isDisclaimerModalOpen}
        onClose={handleDisclaimerModalToggle}
        actions={[
          <Button key="accept" variant="primary" onClick={saveDisclaimerStatus}>
            Accept
          </Button>
        ]}>
        <TextContent>
          <Text component={TextVariants.p}>
            This application is provided "as is" under a MIT licence, without any warranty of any kind.<br />
            Please refer to the <a href='https://github.com/rh-aiservices-bu/image-generation-on-openshift/blob/main/LICENSE' target='_blank'>license file</a> for more details
          </Text>
        </TextContent>
      </Modal>
    </Page>
  );
};

export { AppLayout };
