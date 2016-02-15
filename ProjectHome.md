The **Ext.ux.uploader** package provides a flexible framework for adding upload functionality to your application.

The core of the package are abstract adapter classes that features queue functionality, simultaneous uploads, and a standardized event model. So far, there are implementation for gears and standard html forms. I plan on adding a swf implementation if I have time.

The abstract classes that are implemented are AbstractUploader and AbstractFileUpload. Each adapter must implement both classes and ensure proper event firing.

Also included is a simple Panel extensions that implements the adapters as well as a demonstation page written in php to provide sample usage.