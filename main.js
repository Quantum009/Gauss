const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
require('@electron/remote/main').initialize();

class AppManager {
    static createWindow() {
        const win = new BrowserWindow({
            width: 1280,
            height: 800,
            minWidth: 1024,
            minHeight: 768,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            icon: path.join(__dirname, 'icon.ico'),
            backgroundColor: '#FFFFFF'
        });

        require('@electron/remote/main').enable(win.webContents);
        win.loadFile('index.html');
        
        // 开发环境打开开发者工具
        if (process.env.NODE_ENV === 'development') {
            win.webContents.openDevTools();
        }

        return win;
    }

    static createMenu() {
        const isMac = process.platform === 'darwin';
        const template = [
            {
                label: '文件',
                submenu: [
                    {
                        label: '新建',
                        accelerator: 'CmdOrCtrl+N',
                        click: (menuItem, browserWindow) => {
                            if (browserWindow) browserWindow.webContents.send('new-matrix');
                        }
                    },
                    { type: 'separator' },
                    isMac ? { role: 'close', label: '关闭' } : { role: 'quit', label: '退出' }
                ]
            },
            {
                label: '编辑',
                submenu: [
                    {
                        label: '清空',
                        accelerator: 'CmdOrCtrl+Delete',
                        click: (menuItem, browserWindow) => {
                            if (browserWindow) browserWindow.webContents.send('clear-inputs');
                        }
                    },
                    { type: 'separator' },
                    { role: 'copy', label: '复制' },
                    { role: 'paste', label: '粘贴' },
                    { role: 'selectAll', label: '全选' }
                ]
            },
            {
                label: '视图',
                submenu: [
                    { role: 'resetZoom', label: '重置缩放' },
                    { role: 'zoomIn', label: '放大', accelerator: 'CmdOrCtrl+Plus' },
                    { role: 'zoomOut', label: '缩小', accelerator: 'CmdOrCtrl+-' },
                    { type: 'separator' },
                    { role: 'togglefullscreen', label: '全屏' }
                ]
            },
            {
                label: '帮助',
                submenu: [
                    {
                        label: '关于',
                        click: (menuItem, browserWindow) => {
                            if (browserWindow) browserWindow.webContents.send('show-about');
                        }
                    },
                    {
                        label: '随机示例',
                        accelerator: 'CmdOrCtrl+E',
                        click: (menuItem, browserWindow) => {
                            if (browserWindow) browserWindow.webContents.send('fill-example');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: '开发者工具',
                        accelerator: 'F12',
                        click: (menuItem, browserWindow) => {
                            if (browserWindow) browserWindow.webContents.toggleDevTools();
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    static initApp() {
        // 设置错误处理
        process.on('uncaughtException', (error) => {
            console.error('未捕获的异常:', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('未处理的 Promise 拒绝:', reason);
        });

        // Windows 下的特殊处理
        if (process.platform === 'win32') {
            app.setAppUserModelId('线性方程组求解器');
        }

        // macOS 下的特殊处理
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }
}

// 应用程序初始化
app.whenReady().then(() => {
    AppManager.initApp();
    AppManager.createMenu();
    AppManager.createWindow();
});