package io.couplehub.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetSync")
public class WidgetSyncPlugin extends Plugin {

    @PluginMethod
    public void syncWidgets(PluginCall call) {
        try {
            // Update Calendar Widget
            Intent calendarIntent = new Intent(getContext(), CalendarWidget.class);
            calendarIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            int[] calendarIds = AppWidgetManager.getInstance(getContext()).getAppWidgetIds(new ComponentName(getContext(), CalendarWidget.class));
            calendarIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, calendarIds);
            getContext().sendBroadcast(calendarIntent);

            // Update Todo Widget
            Intent todoIntent = new Intent(getContext(), TodoWidget.class);
            todoIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            int[] todoIds = AppWidgetManager.getInstance(getContext()).getAppWidgetIds(new ComponentName(getContext(), TodoWidget.class));
            todoIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, todoIds);
            getContext().sendBroadcast(todoIntent);

            // Update Pomodoro Widget
            Intent pomodoroIntent = new Intent(getContext(), PomodoroWidget.class);
            pomodoroIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            int[] pomodoroIds = AppWidgetManager.getInstance(getContext()).getAppWidgetIds(new ComponentName(getContext(), PomodoroWidget.class));
            pomodoroIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, pomodoroIds);
            getContext().sendBroadcast(pomodoroIntent);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to sync widgets", e);
        }
    }
}
